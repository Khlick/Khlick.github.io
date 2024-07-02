import bibtexparser
import json
import sys

def clean_bibtex_entry(entry):
    clean_entry = {
        'ENTRYTYPE': entry.entry_type,
        'ID': entry.key
    }
    for field in entry.fields:
        clean_entry[field.key] = field.value.strip('{}')
    return clean_entry

def main():
    bibtex_file_path = sys.argv[1]
    with open(bibtex_file_path) as bibfile:
        bib_database = bibtexparser.parse_file(bibfile.name)
    
    clean_entries = [clean_bibtex_entry(entry) for entry in bib_database.entries]
    print(json.dumps(clean_entries, indent=2))

if __name__ == '__main__':
    main()
