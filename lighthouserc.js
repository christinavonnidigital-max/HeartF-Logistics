/** @type {import('lighthouse-ci').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --host --port 4173",
      url: ["http://localhost:4173/"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.55 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
