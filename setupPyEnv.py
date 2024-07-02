import subprocess
import sys
import os

def create_virtualenv(env_name='.pyRP'):
    """Create a virtual environment in the specified directory."""
    if sys.version_info < (3, 3):
        raise RuntimeError("Python 3.3 or later is required")

    if not os.path.exists(env_name):
        os.makedirs(env_name, exist_ok=True)
        subprocess.check_call([sys.executable, '-m', 'venv', env_name])

def install_requirements(env_name='.pyRP', requirements='requirements.txt'):
    """Install the requirements from the specified requirements file."""
    if not os.path.isfile(requirements):
        raise FileNotFoundError(f"Could not find {requirements}")

    if os.name == 'nt':
        python_bin = os.path.join(env_name, 'Scripts', 'python')
    else:
        python_bin = os.path.join(env_name, 'bin', 'python')

    subprocess.check_call([python_bin, '-m', 'pip', 'install', '--upgrade', 'pip'])
    subprocess.check_call([python_bin, '-m', 'pip', 'install', '-r', requirements])

if __name__ == '__main__':
    env_name = '.python312'
    requirements_file = 'pyRequirements.txt'
    
    create_virtualenv(env_name)
    install_requirements(env_name, requirements_file)
    print(f"Virtual environment '{env_name}' created and dependencies installed.")
