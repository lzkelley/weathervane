from setuptools import setup

with open('requirements.txt') as inn:
    requirements = inn.read().splitlines()

with open("README.md", "r") as inn:
    long_description = inn.read().strip()

with open('weathervane/VERSION.txt') as inn:
    version = inn.read().strip()

setup(
    name="weathervane",
    version=version,
    author="Luke Zoltan Kelley",
    author_email="lzkelley@northwestern.edu",
    # description=("General, commonly used functions for other projects."),
    license="MIT",
    # keywords="",
    # url="https://github.com/lzkelley/weathervane/",
    packages=['weathervane'],
    include_package_data=True,
    install_requires=requirements,
    long_description=long_description,
    # classifiers=[
    #     'Development Status :: 2 - Pre-Alpha',
    #     'Intended Audience :: Developers',
    #     'License :: OSI Approved :: BSD License',
    #     'Natural Language :: English',
    #     'Programming Language :: Python :: 2.7',
    # ],
)
