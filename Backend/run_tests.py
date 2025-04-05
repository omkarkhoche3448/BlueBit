import os
import sys
import argparse
import subprocess
import importlib.util

def check_package_installed(package_name):
    """Check if a package is installed."""
    return importlib.util.find_spec(package_name) is not None

def run_tests(verbose=False, coverage=False, specific_test=None, specific_function=None):
    """
    Run the test suite with the specified options.
    
    Args:
        verbose (bool): Whether to show verbose output
        coverage (bool): Whether to generate a coverage report
        specific_test (str): Path to a specific test file to run
        specific_function (str): Specific test function to run (format: file::function)
    """
    # Change to the Backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Check for required packages
    required_packages = {
        "pytest_cov": "pytest-cov",
        "setuptools": "setuptools"
    }
    
    for module_name, package_name in required_packages.items():
        if not check_package_installed(module_name):
            print(f"Warning: {package_name} is not installed. Installing it now...")
            subprocess.run([sys.executable, "-m", "pip", "install", package_name])
            print(f"{package_name} installed successfully.")
    
    # Build the pytest command
    cmd = [sys.executable, "-m", "pytest"]
    
    # Add options
    if verbose:
        cmd.append("-v")
    
    if coverage:
        cmd.extend(["--cov=.", "--cov-report=term", "--cov-report=html"])
    
    # Add specific test file or function if provided
    if specific_function:
        cmd.append(specific_function)
    elif specific_test:
        cmd.append(specific_test)
    
    # Run the tests
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    
    # Print coverage report location if generated
    if coverage and result.returncode == 0:
        print("\nCoverage HTML report generated in htmlcov/index.html")
    
    return result.returncode

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the HandJobs Backend test suite")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show verbose output")
    parser.add_argument("--cov", action="store_true", help="Generate coverage report")
    parser.add_argument("-t", "--test", help="Run a specific test file")
    parser.add_argument("-f", "--function", help="Run a specific test function (format: file::function)")
    
    args = parser.parse_args()
    
    exit_code = run_tests(
        verbose=args.verbose,
        coverage=args.cov,
        specific_test=args.test,
        specific_function=args.function
    )
    
    sys.exit(exit_code)