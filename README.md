[![Release](https://img.shields.io/github/v/release/kubevious/cli?label=version&color=2ec4b6)](https://github.com/kubevious/cli/releases) [![Issues](https://img.shields.io/github/issues/kubevious/cli?color=red)](https://github.com/kubevious/cli/issues) [![Slack](https://img.shields.io/badge/chat-on%20slack-7b2cbf)](https://kubevious.io/slack) [![Twitter](https://img.shields.io/twitter/url?color=0096c7&logoColor=white&label=Follow&logo=twitter&style=flat&url=https%3A%2F%2Ftwitter.com%2Fkubevious)](https://twitter.com/kubevious) [![Codefresh build status]( https://g.codefresh.io/api/badges/pipeline/kubevious/OSS%2Fcli?type=cf-1)]( https://g.codefresh.io/public/accounts/kubevious/pipelines/new/6351c9e6063ec83876b195be) [![License](https://img.shields.io/badge/License-Apache%202.0-cb997e.svg)](https://opensource.org/licenses/Apache-2.0) ![](https://hit.yhype.me/github/profile?user_id=59004473)


# Kubevious CLI
**Kubevious CLI** is an app-centric assurance and validation tool for Kubernetes. It helps modern teams rapidly release cloud-native applications without disasters, costly outages, and compliance violations by validating changes before they even reach the clusters. Kubevious CLI detects and prevents errors(*typos, misconfigurations, conflicts, inconsistencies*) and violations of best practices. Our secret sauce is based on the ability to validate across multiple manifests, regardless if they are already in the K8s clusters or are yet to be applied. Kubevious CLI can be used as a standalone tool during the active development of YAML manifests and can also be easily integrated into GitOps processes and CI/CD pipelines to validate changes toward live Kubernetes clusters. Kubevious CLI was created based on the experience, and the lessons learned from the [Kubevous Dashboard](https://github.com/kubevious/kubevious) project and uses the evolution of its rules framework.

- [✨ Key Capabilities](#-key-capabilities)
- [📥 Installation](#-installation)
  - [👇 NPM Package](#-option-1-npm-package)
  - [👇 Precompiled Binaries](#-option-2-precompiled-binaries)
  - [👇 In Docker Container](#-option-3-in-a-docker-container)
- [🃏 Usage and Use Cases](#-usage-and-use-cases)
  - [💂 Guard - Comprehensive Cross-Manifest Semantical Validation](#-guard---comprehensive-cross-manifest-semantical-validation)
  - [✅ Lint - Validation of YAML syntax, K8s schema, and CRD/CR](#-lint---validation-of-yaml-syntax-k8s-schema-and-crdcr)
  - [🕹 Input from a Variety of Sources](#-running-inside-a-container)
  - [🪝 Git Pre-Commit Hook](#-git-pre-commit-hook)
- [✍️ Writing Custom Rules](#%EF%B8%8F-writing-custom-rules)

![Kubevious CLI Video](https://raw.githubusercontent.com/kubevious/media/master/cli/intro/demo_light.svg)

## ✨ Key Capabilities

### 🔘 Best Practices Validation

- Community-driven [Rules Library](https://github.com/kubevious/rules-library).
  - Validates K8s native manifests and the popular project uses such as CertManager, Traefik, Istio, etc.
- Your own custom validation rules:
  - from the file system
  - from live Kubernetes cluster
  - Scoped at the cluster level or within the namespace
- Learn more about writing your own validation rules using [Kubik](https://github.com/kubevious/kubik).

### 🔘 Manifest Validation
- Validate YAML syntax
- Validate manifest API correctness
- Validate towards a custom K8s version, or live K8s cluster version

### 🔘 CRDs and Custom Resources
- Validate CRD definitions
- Validate Custom Resources against CRDs in the file system
- Validate Custom Resources against CRDs in the live K8s cluster

### 🔘 Validation Sources

Kubevous CLI validates manifests from a variety of sources:

- files & directories
- search patterns
- web URLs
- stdin pipe - used to validate package managers such as Helm, Kustomize, Ytt, etc.
- live manifests already present in the Kubernetes cluster
- combination of all of the above


## 📥 Installation

### 👇 Option 1: (NPM Package)
If you have Node.js v14 or higher:
```sh
$ npm install -g kubevious
```

```sh
$ kubevious guard samples/
```

### 👇 Option 2: (Precompiled Binaries)
All-in-one executables for Linux, Alpine, Mac OS, and Windows, including x64 and arm64 architectures.
Download from here:
[https://drive.google.com/drive/folders/1y2K6t5VVsU4EkiQnGt0e5SRkZgu-FbL0](https://drive.google.com/drive/folders/1y2K6t5VVsU4EkiQnGt0e5SRkZgu-FbL0)


### 👇 Option 3: (In a Docker container)
Run in a container:
```sh
$ docker run --rm kubevious/cli --help
```

Validate the entire manifests directory:
```sh
$ docker run --rm -v ${PWD}/samples:/src kubevious/cli guard /src
```

Validate Helm Chart or any manifests from pipe stream:
```sh
$ helm template traefik/traefik | docker run --rm -i kubevious/cli guard --stream
$ kustomize build config/default | docker run --rm -i kubevious/cli guard --stream
```

## 🃏 Usage and Use Cases
Try it yourself:

```sh
$ git clone https://github.com/kubevious/cli.git kubevious-cli.git
$ cd kubevious-cli.git/samples
```

### 💂 Guard - Comprehensive Cross-Manifest Semantical Validation

The **guard** command performs **linting** of YAML syntax & API correctness and checks for violations of best-practices rules. 

#### 🔘 Validate single K8s manifest

Will complain about not being able to find the corresponding application matching the label selector:

```sh
$ kubevious guard pepsi/service.yaml

📜 [ClusterRule] service-selector-ref
   🌐 WEB: https://raw.githubusercontent.com/kubevious/rules-library/master/k8s/service/service-selector-ref.yaml
   ❌ Rule failed
   Violations:
      ❌ Namespace: pepsi, API: v1, Kind: Service, Name: emailservice
         📄 FILE: pepsi/service.yaml
         🔴 Could not find Applications for Service
```

#### 🔘 Validate multiple K8s manifests

Passing the Deployment along with the Service would help the validation pass:

```sh
$ kubevious guard pepsi/service.yaml pepsi/deployment.yaml

📜 [ClusterRule] service-selector-ref
   🌐 WEB: https://raw.githubusercontent.com/kubevious/rules-library/master/k8s/service/service-selector-ref.yaml
   ✅ Rule passed
   Passed:
      ✅ Namespace: pepsi, API: v1, Kind: Service, Name: emailservice
         📄 FILE: pepsi/service.yaml
```

#### 🔘 Validate manifests toward live K8s cluster

Alternatively, if the dependent Deployment is already present in the K8s cluster, the Service can be validated against the live K8s cluster:

```sh
$ kubevious guard pepsi/service.yaml --live-k8s

📜 [ClusterRule] service-selector-ref
   🌐 WEB: https://raw.githubusercontent.com/kubevious/rules-library/master/k8s/service/service-selector-ref.yaml
   ✅ Rule passed
   Passed:
      ✅ Namespace: pepsi, API: v1, Kind: Service, Name: emailservice
         📄 FILE: pepsi/service.yaml
```

Although changing pod labels in *pepsi/deployment.yaml* would break the Service label selector, even though the correct Deployment is already in the K8s cluster:

```yaml
spec:
  selector:
    matchLabels:
      app: emailserviceX      # label is inconsistent with Service label selector
  template:
    metadata:
      labels:
        app: emailserviceX    # label is inconsistent with Service label selector
```

```sh
$ kubevious guard pepsi/service.yaml pepsi/deployment.yaml --live-k8s

📜 [ClusterRule] service-selector-ref
   🌐 WEB: https://raw.githubusercontent.com/kubevious/rules-library/master/k8s/service/service-selector-ref.yaml
   ❌ Rule failed
   Violations:
      ❌ Namespace: pepsi, API: v1, Kind: Service, Name: emailservice
         📄 FILE: pepsi/service.yaml
         🔴 Could not find Applications for Service
```

### ✅ Lint - Validation of YAML syntax, K8s schema, and CRD/CR

The **guard** command performs **linting** underneath, so the guard users don't need to run lint separately.

#### 🔘 Checking for API correctness:

```sh
$ kubevious lint invalid-service-1.yaml
ℹ️  Linting against Kubernetes Version: 1.25.2

❌ 📄 FILE: invalid-service-1.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Required property "port" missing under "/spec/ports/0"
```

#### 🔘 Linting against particular K8s version
```sh
$ kubevious lint hpa.yaml --k8s-version 1.21
ℹ️  Linting against Kubernetes Version: 1.21.14

❌ 📄 FILE: hpa.yaml
   ❌ Namespace: ordering, API: autoscaling/v2, Kind: HorizontalPodAutoscaler, Name: orderservice
      🔴 Unknown API Resource. apiVersion: autoscaling/v2, kind: HorizontalPodAutoscaler.
```

```sh
$ kubevious lint hpa.yaml --k8s-version 1.23
ℹ️  Linting against Kubernetes Version: 1.23.12

✅ 📄 FILE: hpa.yaml
   ✅ Namespace: ordering, API: autoscaling/v2, Kind: HorizontalPodAutoscaler, Name: orderservice
```

#### 🔘 Ignoring unknown resources

```sh
$ kubevious lint istio-gateway.yaml --ignore-unknown

⚠️  📄 FILE: istio-gateway.yaml
   ⚠️  Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway
      ⚠️  Unknown API Resource. apiVersion: networking.istio.io/v1alpha3, kind: Gateway.

✅ Lint Succeeded.
```

#### 🔘 Validate Against Live K8s Cluster with CRDs
```sh
$ kubevious lint istio-gateway.yaml --live-k8s
ℹ️  Linting against Kubernetes Version: v1.24.0

✅ 📄 FILE: data/istio-gateway.yaml
   ✅ Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway
```

#### 🔘 Validate Custom Resource and Corresponding CRD
```sh
$ kubevious lint cr-good.yaml crd.yaml
ℹ️  Linting against Kubernetes Version: 1.25.2

✅ 📄 FILE: cr-good.yaml
   ✅ Namespace: coke, API: example.com/v1alpha1, Kind: MyPlatform, Name: test-dotnet-app

✅ 📄 FILE: crd.yaml
   ✅ API: apiextensions.k8s.io/v1, Kind: CustomResourceDefinition, Name: myplatforms.example.com
```

### 🕹 Input from a Variety of Sources

#### 🔘 Multiple Directories

```sh
$ kubevious guard sveltos/ pepsi/
```

#### 🔘 Stream Input

Primary usage is to validate template outputs such as Helm Charts, Kuztomize, Carvel, etc.

```sh
$ helm repo add traefik https://helm.traefik.io/traefik
$ helm template traefik/traefik | kubevious guard --stream

❌ ♒ STREAM: stream
   ✅ Namespace: default, API: v1, Kind: Service, Name: release-name-traefik
   ✅ Namespace: default, API: v1, Kind: ServiceAccount, Name: release-name-traefik
   ✅ Namespace: default, API: apps/v1, Kind: Deployment, Name: release-name-traefik
   ❌ Namespace: default, API: traefik.containo.us/v1alpha1, Kind: IngressRoute, Name: release-name-traefik-dashboard
      🔴 Unknown API Resource. apiVersion: traefik.containo.us/v1alpha1, kind: IngressRoute.
   ✅ API: networking.k8s.io/v1, Kind: IngressClass, Name: release-name-traefik
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRole, Name: release-name-traefik-default
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRoleBinding, Name: release-name-traefik-default
```

Also can pass additional manifests, such as CRDs, Rules, etc., for validation along with the steam input.

```sh
$ helm template traefik/traefik | kubevious guard --stream https://raw.githubusercontent.com/traefik/traefik-helm-chart/master/traefik/crds/ingressroute.yaml

✅ ♒ STREAM: stream
   ✅ Namespace: default, API: v1, Kind: Service, Name: release-name-traefik
   ✅ Namespace: default, API: v1, Kind: ServiceAccount, Name: release-name-traefik
   ✅ Namespace: default, API: apps/v1, Kind: Deployment, Name: release-name-traefik
   ✅ Namespace: default, API: traefik.containo.us/v1alpha1, Kind: IngressRoute, Name: release-name-traefik-dashboard
   ✅ API: networking.k8s.io/v1, Kind: IngressClass, Name: release-name-traefik
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRole, Name: release-name-traefik-default
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRoleBinding, Name: release-name-traefik-default
```

### 📦 Running Inside a Container

#### 🔘 Validate the Entire Directory

Mount a local directory to */src* in the container. The rest of the arguments are the same.

```sh
$ docker run --rm -v ${PWD}/pepsi:/src kubevious/cli guard /src
❌ Guard Failed
```

#### 🔘 Validate Files

The directory must be mounted to */src* in the container to validate individual files. Can pass file names in the command line arguments.

```sh
$ docker run --rm -v ${PWD}/pepsi:/src kubevious/cli guard /src/service.yaml /src/deployment.yaml
✅ Guard Succeeded.
```

#### 🔘 Stream Input

Don't forget the **-i** argument.

```sh
$ helm template traefik/traefik | docker run --rm -i kubevious/cli guard --stream

❌ ♒ STREAM: stream
   ✅ Namespace: default, API: v1, Kind: Service, Name: release-name-traefik
   ✅ Namespace: default, API: v1, Kind: ServiceAccount, Name: release-name-traefik
   ✅ Namespace: default, API: apps/v1, Kind: Deployment, Name: release-name-traefik
   ❌ Namespace: default, API: traefik.containo.us/v1alpha1, Kind: IngressRoute, Name: release-name-traefik-dashboard
      🔴 Unknown API Resource. apiVersion: traefik.containo.us/v1alpha1, kind: IngressRoute.
   ✅ API: networking.k8s.io/v1, Kind: IngressClass, Name: release-name-traefik
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRole, Name: release-name-traefik-default
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRoleBinding, Name: release-name-traefik-default
```

Passing CRDs as input would fix the issue:

```sh
$ helm template traefik/traefik | docker run --rm -i kubevious/cli guard --stream https://raw.githubusercontent.com/traefik/traefik-helm-chart/master/traefik/crds/ingressroute.yaml

✅ ♒ STREAM: stream
   ✅ Namespace: default, API: v1, Kind: Service, Name: release-name-traefik
   ✅ Namespace: default, API: v1, Kind: ServiceAccount, Name: release-name-traefik
   ✅ Namespace: default, API: apps/v1, Kind: Deployment, Name: release-name-traefik
   ✅ Namespace: default, API: traefik.containo.us/v1alpha1, Kind: IngressRoute, Name: release-name-traefik-dashboard
   ✅ API: networking.k8s.io/v1, Kind: IngressClass, Name: release-name-traefik
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRole, Name: release-name-traefik-default
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRoleBinding, Name: release-name-traefik-default
```

### 🪝 Git Pre-Commit Hook

You can get **guard** and **lint** commands to execute whenever changes to the GitOps repo are made. Kubevious uses the [pre-commit](https://pre-commit.com/) project to set up pre-commit hooks. For convenience, there are commands to install hooks:

```sh
$ kubevious install-git-hook guard
   ℹ️  Repository: /Users/django/example.git
   ℹ️  PreCommit Config File: /Users/django/example.git/.pre-commit-config.yaml
   ℹ️  Hook Repo: https://github.com/kubevious/cli
   ℹ️  Hook ID: kubevious-guard

✅ Install Git Hook Succeeded.
   Now you can run: 
     $> cd /Users/django/example.git
     $> git add .pre-commit-config.yaml
     $> pre-commit autoupdate
```

or

```sh
$ kubevious install-git-hook lint
```

## ✍️ Writing Custom Rules

Kubevious rules are expressed in a domain-specific language called [Kubik](https://github.com/kubevious/kubik). A great way to start writing your own rules is to learn from the [community-driven rules library](https://github.com/kubevious/rules-library).

## 💬 Slack
Join the [Kubevious Slack workspace](https://kubevious.io/slack) to chat with Kubevious developers and users. This is a good place to learn about Kubevious, ask questions, and share your experiences.

## 🏗️ Contributing
We invite your participation through issues and pull requests! You can peruse the [contributing guidelines](https://github.com/kubevious/kubevious/blob/master/CONTRIBUTING.md).

## 🏛️ Governance
The Kubevious project is created by [AUTHORS](https://github.com/kubevious/kubevious/blob/master/AUTHORS.md). Governance policy is yet to be defined.

## 🚀 Roadmap
Kubevious maintains a public [roadmap](https://github.com/kubevious/kubevious/blob/master/ROADMAP.md), which provides priorities and future capabilities we are planning on adding to Kubevious.

## 🔭 Kubevious Project
Learn more about the Kubevious projects in the root repository: https://github.com/kubevious/kubevious

## 📜 License
Kubevious CLI is an open-source project licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). 
