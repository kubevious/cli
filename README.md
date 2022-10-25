[![Release](https://img.shields.io/github/v/release/kubevious/cli?label=version&color=2ec4b6)](https://github.com/kubevious/cli/releases) [![Issues](https://img.shields.io/github/issues/kubevious/cli?color=red)](https://github.com/kubevious/cli/issues) [![Slack](https://img.shields.io/badge/chat-on%20slack-7b2cbf)](https://kubevious.io/slack) [![Twitter](https://img.shields.io/twitter/url?color=0096c7&logoColor=white&label=Follow&logo=twitter&style=flat&url=https%3A%2F%2Ftwitter.com%2Fkubevious)](https://twitter.com/kubevious)  [![License](https://img.shields.io/badge/License-Apache%202.0-cb997e.svg)](https://opensource.org/licenses/Apache-2.0) ![](https://hit.yhype.me/github/profile?user_id=59004473)


# Kubevious CLI
Kubevious CLI helps validate Kubernetes manifests for issues and misconfiguration. It works as a stand-alone tool and can be easily integrated into CI/CD processes. 

- [✨ Key Capabilities](#-key-capabilities)
- [🔮 Coming Soon](#-coming-soon)
- [📥 Installation](#-installation)
  - [👇 NPM Package](#)
  - [👇 Precompiled Binaries](#)
  - [👇 Docker image](#)
- [🃏 Usage Examples](#-usage-examples)

## ✨ Key Capabilities
- Validate from sources:
   - files & directories
   - search pattern
   - web URL
   - stdin pipe
- Validate YAML structure
- Validate Kubernetes manifest syntax
- Validate for the specified K8s version
- Validate towards a live running K8s cluster
- Validate CRs and CRDs
- Validate configurator packages such as Helm, Kustomize, etc.

## 🔮 Coming Soon
- Cross-manifest validation using [Kubevious Validators](https://github.com/kubevious/kubevious#-validate).
- Integration with [Kubevius Guard](https://github.com/kubevious/kubevious#-guard) to validate custom rules.

## 📥 Installation

### 👇 Option 1: (NPM Package)
If you have Node.js v14 or higher:
```sh
$ npm install -g kubevious
```

```sh
$ kubevious lint samples/
```

### 👇 Option 2: (Precompiled Binaries)
All-in-one executables for Linux, Alpine, Mac OS, and Windows and x64 and arm64 architectures.
Download from here:
[https://drive.google.com/drive/folders/1y2K6t5VVsU4EkiQnGt0e5SRkZgu-FbL0](https://drive.google.com/drive/folders/1y2K6t5VVsU4EkiQnGt0e5SRkZgu-FbL0)


### 👇 Option 3: (In a container)
Run in a container:
```sh
$ docker run kubevious/cli --help
```

Validate the entire manifests directory:
```sh
$ docker run -v ${PWD}/samples:/manifests kubevious/cli lint /manifests
```

Validate Helm Chart or any manifests from pipe stream:
```sh
$ helm template traefik/traefik | docker run -i kubevious/cli lint
```

## 🃏 Usage Examples
Try it yourself:

```sh
$ git clone https://github.com/kubevious/cli.git kubevious-cli.git
$ cd kubevious-cli.git/samples
```

### Validate single K8s manifest
```sh
$ kubevious lint invalid-service-1.yaml
ℹ️  Linting against Kubernetes Version: 1.25.2

❌ 📄 FILE: invalid-service-1.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Required property "port" missing under "/spec/ports/0"

❌ Lint Failed
```

### Validate from Web URL
```sh
$ kubevious lint https://raw.githubusercontent.com/GoogleCloudPlatform/microservices-demo/main/kubernetes-manifests/frontend.yaml
ℹ️  Linting against Kubernetes Version: 1.25.2

✅ 🌐 WEB: https://raw.githubusercontent.com/GoogleCloudPlatform/microservices-demo/main/kubernetes-manifests/frontend.yaml
   ✅ API: v1, Kind: Service, Name: frontend
   ✅ API: v1, Kind: Service, Name: frontend-external
   ✅ API: apps/v1, Kind: Deployment, Name: frontend

✅ Lint Succeeded.
```

### Specify K8s version
```sh
$ kubevious lint istio-gateway.yaml --k8s-version 1.21
ℹ️  Linting against Kubernetes Version: 1.21.14

❌ 📄 FILE: istio-gateway.yaml
   ❌ Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway
      ❌ Unknown API Resource. apiVersion: networking.istio.io/v1alpha3, kind: Gateway.

❌ Lint Failed
```

### Ignore unknown resources
```sh
$ kubevious lint istio-gateway.yaml --ignore-unknown
ℹ️  Linting against Kubernetes Version: 1.25.2

⚠️  📄 FILE: istio-gateway.yaml
   ⚠️  Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway
      ⚠️  Unknown API Resource. apiVersion: networking.istio.io/v1alpha3, kind: Gateway.

✅ Lint Succeeded.
```

### Validate against live K8s cluster with CRDs
```sh
$ kubevious lint istio-gateway.yaml --live-k8s
ℹ️  Linting against Kubernetes Version: v1.24.0

✅ 📄 FILE: data/istio-gateway.yaml
   ✅ Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway

✅ Lint Succeeded.
```

### Validate Custom Resource and corresponding CRD
```sh
$ kubevious lint cr-good.yaml crd.yaml
ℹ️  Linting against Kubernetes Version: 1.25.2

✅ 📄 FILE: cr-good.yaml
   ✅ API: contoso.com/v1alpha1, Kind: MyPlatform, Name: test-dotnet-app

✅ 📄 FILE: crd.yaml
   ✅ API: apiextensions.k8s.io/v1, Kind: CustomResourceDefinition, Name: myplatforms.contoso.com

✅ Lint Succeeded.
```

### Validate Helm Charts
```sh
$ helm repo add traefik https://helm.traefik.io/traefik
$ helm template traefik/traefik | kubevious lint
ℹ️  Linting against Kubernetes Version: 1.25.2

❌ ♒ STREAM: stream
   ✅ API: v1, Kind: Service, Name: release-name-traefik
   ✅ API: v1, Kind: ServiceAccount, Name: release-name-traefik
   ✅ API: apps/v1, Kind: Deployment, Name: release-name-traefik
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRole, Name: release-name-traefik-default
   ✅ API: rbac.authorization.k8s.io/v1, Kind: ClusterRoleBinding, Name: release-name-traefik-default
   ❌ API: traefik.containo.us/v1alpha1, Kind: IngressRoute, Name: release-name-traefik-dashboard
      ❌ Unknown API Resource. apiVersion: traefik.containo.us/v1alpha1, kind: IngressRoute.

❌ Lint Failed
```

### Validate Entire Directory
```sh
$ kubevious lint *
ℹ️  Linting against Kubernetes Version: 1.25.2

❌ 📄 FILE: bad-json.json
   ❌ Unexpected token x in JSON at position 49

❌ 📄 FILE: bad-yaml.yaml
   ❌ bad indentation of a mapping entry (6:3)
   
    3 | metadata:
    4 |    labels:
    5 |     app: db
    6 |   name: db
   -------^
    7 | spec:
    8 |   type: ClusterIP

✅ 📄 FILE: cr-good.yaml
   ✅ API: contoso.com/v1alpha1, Kind: MyPlatform, Name: test-dotnet-app

❌ 📄 FILE: cr-invalid.yaml
   ❌ API: contoso.com/v1alpha1, Kind: MyPlatform, Name: test-dotnet-app
      ❌ Unknown enum value provided in "/spec/environmentType". Allowed values are: dev, test, prod.

❌ 📄 FILE: cr-unknown.yaml
   ❌ API: example.com/v1, Kind: MyResource, Name: test-dotnet-app
      ❌ Unknown API Resource. apiVersion: example.com/v1, kind: MyResource.

❌ 📄 FILE: crd-invalid.yaml
   ❌ API: apiextensions.k8s.io/v1, Kind: CustomResourceDefinition, Name: myplatformanothers.contoso.com
      ❌ schema is invalid: data/definitions/com.contoso.v1alpha1.MyPlatformAnother/properties/spec/properties/appId/type must be equal to one of the allowed values, data/definitions/com.contoso.v1alpha1.MyPlatformAnother/properties/spec/properties/appId/type must be array, data/definitions/com.contoso.v1alpha1.MyPlatformAnother/properties/spec/properties/appId/type must match a schema in anyOf

✅ 📄 FILE: crd.yaml
   ✅ API: apiextensions.k8s.io/v1, Kind: CustomResourceDefinition, Name: myplatforms.contoso.com

✅ 📄 FILE: deployment.yaml
   ✅ API: apps/v1, Kind: Deployment, Name: emailservice

❌ 📄 FILE: empty.yaml
   ❌ Contains no manifests

❌ 📄 FILE: invalid-service-1.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Required property "port" missing under "/spec/ports/0"

❌ 📄 FILE: invalid-service-2.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Unknown property "portish" under "/spec"

❌ 📄 FILE: invalid-service-3.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Unknown enum value provided in "/spec/ports/0/protocol". Allowed values are: SCTP, TCP, UDP.

❌ 📄 FILE: invalid-service-4.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Invalid type under "/spec/ports/0/port". Must be integer.

❌ 📄 FILE: invalid-service-5.yaml
   ❌ API: v1, Kind: Service, Name: db
      ❌ Invalid type under "/spec/ports/0/name". Must be string.

❌ 📄 FILE: istio-gateway.yaml
   ❌ Namespace: hipster, API: networking.istio.io/v1alpha3, Kind: Gateway, Name: frontend-gateway
      ❌ Unknown API Resource. apiVersion: networking.istio.io/v1alpha3, kind: Gateway.

✅ 📄 FILE: multiple-manifests.yaml
   ✅ API: v1, Kind: Service, Name: checkoutservice
   ✅ API: v1, Kind: Service, Name: emailservice
   ✅ API: apps/v1, Kind: Deployment, Name: checkoutservice

✅ 📄 FILE: network-policy.yaml
   ✅ API: networking.k8s.io/v1, Kind: NetworkPolicy, Name: adservice

❌ 📄 FILE: payload-pod.json
   ❌ API: v1, Kind: Pod, Name: undefined
      ❌ Unknown enum value provided in "/spec/containers/0/ports/0/protocol". Allowed values are: SCTP, TCP, UDP.

❌ 📄 FILE: payload-service.json
   ❌ API: v1, Kind: Service, Name: undefined
      ❌ Required property "port" missing under "/spec/ports/0"

❌ Lint Failed
```

## 🏗️ Contributing
We invite your participation through issues and pull requests! You can peruse the [contributing guidelines](https://github.com/kubevious/kubevious/blob/master/CONTRIBUTING.md).

## 🏛️ Governance
The Kubevious project is created by [AUTHORS](https://github.com/kubevious/kubevious/blob/master/AUTHORS.md). Governance policy is yet to be defined.

## 🚀 Roadmap
Kubevious maintains a public [roadmap](https://github.com/kubevious/kubevious/blob/master/ROADMAP.md), which provides priorities and future capabilities we are planning on adding to Kubevious.

# 📜 License
Kubevious CLI is an open-source project licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). 