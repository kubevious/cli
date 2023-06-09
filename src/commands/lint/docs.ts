import { generateUsageSample } from "../../screen/docs";
import { SAMPLES } from "./samples";

export const SUMMARY = "Check Kubernetes manifests for API syntax validity.";

export const DESCRIPTION = `${SUMMARY}

${generateUsageSample(SAMPLES)}`;


export const ARG_PATH = 'Path to files, directories, search patterns, URLs, HELM Charts, Kustomize, etc';

export const OPTION_IGNORE_UNKNOWN = 'Ignore unknown resources. Use when manifests include CRDs and not using --live-k8s option.';
export const OPTION_IGNORE_NON_K8S = 'Ignore non-k8s files.';
export const OPTION_SKIP_APPLY_CRDS = 'Skips CRD application.';
export const OPTION_STREAM = 'Also read manifests from stream.';
export const OPTION_K8S_VERSION = 'Target Kubernetes version. Do not use with --live-k8s option.';
export const OPTION_LIVE_K8S = 'Lint against live Kubernetes cluster. Allows validation of CRDs. Do not use with --k8s-version option.';
export const OPTION_K8S_SKIP_TLS_VERIFY = 'Skips TLS certificate verification when connecting to live K8s. Has effects when using with --live-k8s option.';
export const OPTION_KUBECONFIG = 'Optionally set the path to the kubeconfig file. Use with --live-k8s option.';
export const OPTION_IGNORE_FILE = 'Path to .gitignore file to filter out input patterns.';
export const OPTION_IGNORE_PATTERNS = 'File patters to ignore.';
export const OPTION_DETAILED = 'Detailed output.';
export const OPTION_JSON = 'Output command result in JSON.';
