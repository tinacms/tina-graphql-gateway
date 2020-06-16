import fs from "fs-extra";
import path from "path";

export const appDirectory = fs.realpathSync(process.cwd());
export function resolveApp(relativePath: string) {
  return path.resolve(appDirectory, relativePath);
}

const projectRoot = path.resolve(__dirname, "../");

export const paths = {
  projectRoot,
  packagePackageJson: resolveApp("package.json"),
  // packageTsconfigBuildJson: path.join(projectRoot, "tsconfig.json"),
  packageTsconfigBuildJson: resolveApp("tsconfig.build.json"),
  testsSetup: path.join(projectRoot, "test/setupTests.ts"),
  packageRoot: resolveApp("."),
  packageDist: resolveApp("dist"),
  projectCache: path.join(projectRoot, ".cache"),
  progressEstimatorCache: path.join(
    projectRoot,
    "node_modules/.cache/.progress-estimator"
  ),
};
