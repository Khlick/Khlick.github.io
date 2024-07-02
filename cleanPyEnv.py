import shutil
import os

def remove_virtualenv(env_name='.pyRP'):
    """Remove the virtual environment directory."""
    if os.path.exists(env_name):
        shutil.rmtree(env_name)
        print(f"Virtual environment '{env_name}' has been removed.")
    else:
        print(f"Virtual environment '{env_name}' does not exist.")

if __name__ == '__main__':
    env_name = '.python312'
    remove_virtualenv(env_name)
