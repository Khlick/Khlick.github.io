param (
    [string]$bibFile,
    [switch]$publish,
    [switch]$useChatGPT = $false
)

function Show-Help {
    Write-Host "Usage: .\Convert-BibTeXToMarkdown.ps1 -bibFile <path_to_bib_file> [-publish] [-useChatGPT]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -bibFile     (Required) Path to the BibTeX file to be converted."
    Write-Host "  -publish     (Optional) If specified, save the generated .md files in the ./_posts directory rather than the default ./_drafts directory."
    Write-Host "  -useChatGPT  (Optional) If specified, use the ChatGPT API to process abstracts. By default, this is not used."
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\Convert-BibTeXToMarkdown.ps1 -bibFile ""path\to\your\file.bib"""
    Write-Host "  .\Convert-BibTeXToMarkdown.ps1 -bibFile ""path\to\your\file.bib"" -publish -useChatGPT"
}

# Show help if no arguments are provided
if (-not $PSBoundParameters.ContainsKey('bibFile')) {
    Show-Help
    exit
}

# Function to read the OpenAI API key from a file
function Get-OpenAIAPIKey {
    $apiKeyFile = 'api_key.txt'
    if (-not (Test-Path -Path $apiKeyFile)) {
        Write-Error 'API key file not found. Please create a file named "api_key.txt" with your OpenAI API key.'
        exit 1
    }
    return Get-Content -Path $apiKeyFile -Raw
}

# Function to get both cleaned abstract and tags using OpenAI API
function Process-AbstractWithAPI {
    param (
        [string]$abstract,
        [string]$apiKey
    )
    $openaiApiUrl = 'https://api.openai.com/v1/chat/completions'
    $headers = @{
        'Content-Type'  = 'application/json'
        'Authorization' = "Bearer $apiKey"
    }
    $body = @{
        'model'       = 'gpt-3.5-turbo'
        'messages'    = @(
            @{
                'role'    = 'system'
                'content' = 'You are an assistant that cleans and formats abstracts for markdown with latex math where possible and extracts relevant tags.'
            },
            @{
                'role'    = 'user'
                'content' = "Clean and nicely format the following abstract for markdown, handling any special characters and math notation for latex, and extract relevant tags: $abstract"
            }
        )
        'max_tokens'  = 300
        'n'           = 1
        'temperature' = 0.5
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $openaiApiUrl -Method Post -Headers $headers -Body $body
    $result = $response.choices[0].message.content.Trim()
    $processedData = $result -split "`n"
    $cleanedAbstract = $processedData[0].Trim()
    $tags = $processedData[1..($processedData.Length - 1)] -join ',' -split ','
    return @{ 'abstract' = $cleanedAbstract; 'tags' = $tags }
}

# Function to convert BibTeX to YAML header and Markdown content
function Convert-BibTeXToMarkdown {
  param (
      [hashtable]$fields,
      [bool]$useChatGPT
  )

  # Determine publication type and type-label
  if ($fields['ENTRYTYPE'] -eq 'article') {
      $type = '3-article-journal'
      $typeLabel = 'Journal Articles'
  } elseif ($fields['ENTRYTYPE'] -eq 'phdthesis') {
      $type = '2-dissertation-thesis'
      $typeLabel = 'Ph.D. Dissertation'
  } elseif ($fields['ENTRYTYPE'] -eq 'inproceedings') {
      $type = '1-inproceedings'
      $typeLabel = 'Conferences And Presentations'
  } else {
      $type = '0-otherpubs'
      $typeLabel = 'Other Publications And Articles'
  }

  $apiKey = Get-OpenAIAPIKey

  if ($useChatGPT -and $fields.ContainsKey('abstract')) {
      try {
          Write-Host "Processing abstract with OpenAI API..."
          $processedData = Process-AbstractWithAPI -abstract $fields['abstract'] -apiKey $apiKey
          Write-Host "Successfully processed abstract with OpenAI API."
      } catch {
          Write-Host "Error processing abstract with OpenAI API: $_"
          $processedData = @{ 'abstract' = $fields['abstract']; 'tags' = @() }
      }
  } else {
      $processedData = @{ 'abstract' = $fields['abstract']; 'tags' = @() }
  }

  $cleanedAbstract = $processedData['abstract']
  $tags = $processedData['tags']

  # Prepare the YAML front matter and Markdown content
  $yaml = @(
      '---',
      'author: none',
      "date: $($fields['year'])-01-01 01:01:01 -0700",
      'options:',
      ' - minihead',
      "title: >",
      "  $($fields['title'])",
      'excerpt:',
      "type: $type",
      "type-label: $typeLabel",
      'categories:',
      '  - publications',
      'pubauthor:'
  )

  foreach ($author in $fields['author'] -split ' and ') {
      $author = $author.Trim()
      if ($author -match '(\w+), (\w+)') {
          $yaml += "  - family: $($matches[1])"
          $yaml += "    given: $($matches[2])"
      }
  }

  $volume = if ($fields.ContainsKey('volume')) { $fields['volume'] } else { 'false' }

  $yaml += @(
      'author-highlight: Griffis',
      "pub-date: $($fields['year'])",
      "published-in: $($fields['journal'])",
      "volume: $volume($($fields['number']))",
      "page: $($fields['pages'])",
      "exturl: $($fields['url'])",
      'tags:'
  )

  foreach ($tag in $tags) {
      $yaml += "  - $tag"
  }

  $yaml += @(
      '---',
      '',
      "<a href=""$($fields['url'])"" target=""_blank"">Source</a>",
      '',
      '## Abstract:',
      '',
      "$cleanedAbstract",
      ''
  )

  return $yaml -join "`n"
}

# Function to save the Markdown content to a file
function Save-MarkdownFile {
  param (
      [string]$markdownContent,
      [string]$outputDir,
      [string]$fileName
  )

  $filePath = Join-Path -Path $outputDir -ChildPath $fileName
  Set-Content -Path $filePath -Value $markdownContent
}

# Validate the input file
if (-not (Test-Path -Path $bibFile)) {
  Write-Error 'The specified BibTeX file does not exist.'
  exit 1
}

# Determine the output directory
$outputDir = if ($publish) { './_posts' } else { './_drafts' }

# Create the output directory if it doesn't exist
if (-not (Test-Path -Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory | Out-Null
}

# Call the Python script to parse the BibTeX file
$pythonScript = "parse_bibtex.py"
$parsedBibTeX = & python $pythonScript $bibFile

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Error parsing the BibTeX file with the Python script.'
  exit 1
}

$bibtexEntries = $parsedBibTeX | ConvertFrom-Json

foreach ($bibtexEntry in $bibtexEntries) {
  $entryHashtable = @{}
  $bibtexEntry.PSObject.Properties | ForEach-Object { $entryHashtable[$_.Name] = $_.Value }

  $markdownContent = Convert-BibTeXToMarkdown -fields $entryHashtable -useChatGPT:$useChatGPT
  $firstAuthorLastName = $bibtexEntry.author.split(',')[0].Trim()
  $pubYear = $bibtexEntry.year
  $fileName = "{0:yyyy-MM-dd}-{1}{2}.md" -f (Get-Date), $firstAuthorLastName, $pubYear
  Save-MarkdownFile -markdownContent $markdownContent -outputDir $outputDir -fileName $fileName
}

Write-Host "Markdown files have been generated in $outputDir."