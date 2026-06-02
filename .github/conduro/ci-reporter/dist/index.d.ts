#!/usr/bin/env node
declare function runGateCli(argv: string[]): Promise<number>;
declare function runCli(argv: string[]): Promise<number>;

export { runCli, runGateCli };
