# Setup Compressor

[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/ixray-team/setup-compressor?include_prereleases&label=Release)](https://github.com/ixray-team/setup-compressor/releases/tag/v0.1)
[![Open in Dev Containers](https://img.shields.io/static/v1?label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/ixray-team/setup-compressor)
[![Run action](https://github.com/ixray-team/setup-compressor/actions/workflows/run-action.yml/badge.svg)](https://github.com/ixray-team/setup-compressor/actions/workflows/run-action.yml)

Action for installing and configuring __IX-Ray Compressor__ utility to `PATH` of the runner

## Inputs

List of available inputs:

- `codebase`
  - Requested version of IX-Ray codebase
  - Required
- `release`
  - Requested version of IX-Ray release
  - Required
  - Default value `latest`

## Example usage

```yaml
uses: ixray-team/setup-compressor@v0.1
with:
  codebase: '1.6-stcop'
  release: '1.0'
```

## License

Contents of this repository licensed under terms of the __MIT license__ unless otherwise specified. See [this](./LICENSE) file for details
