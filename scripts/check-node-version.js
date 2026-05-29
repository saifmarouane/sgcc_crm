const major = Number(process.versions.node.split(".")[0]);

if (major !== 22 && major !== 23) {
  console.error(
    `This project must run with Node 22 or 23. Current version: ${process.version}`,
  );
  console.error("Run: nvm install 22.13.1 && nvm use 22.13.1, or use Node 23.");
  process.exit(1);
}
