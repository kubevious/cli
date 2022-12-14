import { generateUsageSample } from "../../screen/docs";
import { SAMPLES } from "./samples";

export const SUMMARY = "Lint local manifests and validate Kubernetes for cross-manifest violations and errors.";

export const DESCRIPTION = `${SUMMARY}

${generateUsageSample(SAMPLES)}
`;