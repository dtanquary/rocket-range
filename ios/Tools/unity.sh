#!/bin/sh
# Local development only. Outputs and logs stay in ignored Builds/.
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
unity_editor=${UNITY_EDITOR:-/Applications/Unity/Hub/Editor/6000.3.11f1/Unity.app/Contents/MacOS/Unity}
if [ ! -x "$unity_editor" ]; then
  echo 'Unity 6000.3.11f1 was not found. Set UNITY_EDITOR to the Unity executable.' >&2
  exit 1
fi
mkdir -p "$project_dir/Builds"
case "${1:-}" in
  configure) method=Configure ;;
  simulator) method=BuildSimulator ;;
  device) method=BuildDevice ;;
  mac) method=BuildMac ;;
  test)
    exec "$unity_editor" -batchmode -nographics -projectPath "$project_dir" -runTests -testPlatform EditMode -testResults "$project_dir/Builds/TestResults.xml" -logFile "$project_dir/Builds/tests.log"
    ;;
  *) echo 'Usage: ios/Tools/unity.sh configure|test|simulator|device|mac' >&2; exit 2 ;;
esac
if [ "$1" = simulator ] || [ "$1" = device ]; then
  exec "$unity_editor" -batchmode -nographics -quit -projectPath "$project_dir" -buildTarget iOS -executeMethod "RocketRange.Editor.ProjectSetup.$method" -logFile "$project_dir/Builds/$1.log"
fi
exec "$unity_editor" -batchmode -nographics -quit -projectPath "$project_dir" -executeMethod "RocketRange.Editor.ProjectSetup.$method" -logFile "$project_dir/Builds/$1.log"
