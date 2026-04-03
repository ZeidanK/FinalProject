export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/bin/**",
      "**/obj/**",
      "Server/**",
      "new/**",
      "randTest/**",
      "uploads/**",
      "uml/**"
    ]
  },
  {
    files: ["ClientSide/**/*.{js,jsx}", "mock/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^[A-Z_]" }],
      "no-undef": "error"
    }
  }
]
