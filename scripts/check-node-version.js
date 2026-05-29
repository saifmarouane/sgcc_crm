const major = Number(process.versions.node.split(".")[0]);

if (![22, 23, 24].includes(major)) {
  console.error(
    `This project must run with Node 22, 23, or 24. Current version: ${process.version}`,
  );
  console.error("Use Node 22, 23, or 24.");
  process.exit(1);
}
