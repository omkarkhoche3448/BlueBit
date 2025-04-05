import os
import sys
import subprocess
import webbrowser
import importlib

def check_dependencies():
    """Check if all required dependencies are installed."""
    required_packages = ['flask', 'pytest', 'pytest-cov', 'sqlalchemy']
    missing_packages = []
    
    for package in required_packages:
        try:
            importlib.import_module(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Missing required packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        subprocess.run([sys.executable, "-m", "pip", "install", *missing_packages])
        print("Packages installed successfully.")

def run_coverage():
    """Run pytest with coverage and generate a report."""
    # Check dependencies
    check_dependencies()
    
    # Run pytest with coverage
    result = subprocess.run(
        ["pytest", "--cov=.", "--cov-report=html", "tests/"],
        capture_output=True,
        text=True
    )
    
    # Print the output
    print(result.stdout)
    
    if result.stderr:
        print("Errors encountered:")
        print(result.stderr)
    
    # Check if the coverage report was generated
    report_path = os.path.join(os.getcwd(), "htmlcov", "index.html")
    if os.path.exists(report_path):
        print(f"Opening coverage report at {report_path}")
        webbrowser.open(f"file://{report_path}")
    else:
        print("Coverage report was not generated due to errors.")
        
    # Return the exit code
    return result.returncode

if __name__ == "__main__":
    exit_code = run_coverage()
    if exit_code != 0:
        print(f"Tests failed with exit code {exit_code}")
        print("Please fix the errors above before proceeding.")
        print("Try running only the app initialization tests first to isolate issues.")
    else:
        print("All tests passed successfully!")