FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    git \
    && apt-get clean

WORKDIR /workspaces/app