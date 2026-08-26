pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  triggers {
    // GitHub sends a webhook to Jenkins the moment you push.
    // Requires: ngrok tunnel + GitHub webhook pointing to http://<ngrok-url>/github-webhook/
    githubPush()
  }

  environment {
    REPORT_DIR = 'build/security-reports'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'cd backend  && npm ci --no-audit --no-fund'
        sh 'cd frontend && npm ci --no-audit --no-fund --legacy-peer-deps'
      }
    }

    stage('Build & Lint') {
      steps {
        sh 'cd backend && node --check index.js'
        sh 'cd backend && npm run lint'
        sh 'cd frontend && npm run lint'
        // Uncomment for a full production build check (slower):
        // sh 'cd frontend && npm run build'
      }
    }

    stage('Security Scan') {
      steps {
        sh "mkdir -p ${REPORT_DIR}"
        script {
          def rows = []
          rows << 'Expense Tracker — CI Security Report'
          rows << "Build: #${env.BUILD_ID}"
          rows << "Commit: ${env.GIT_COMMIT}"
          rows << ''

          def totalHigh = 0
          def totalCritical = 0

          // severity -> rank, for sorting worst-first
          def sevRank = { s ->
            switch (s?.toLowerCase()) {
              case 'critical': return 4
              case 'high':     return 3
              case 'moderate': return 2
              case 'low':      return 1
              default:         return 0
            }
          }

          ['backend', 'frontend'].each { svc ->
            // `npm audit --json` exits 1 when vulns exist; capture the JSON either way.
            def json = sh(
              script: "cd ${svc} && npm audit --json 2>/dev/null || true",
              returnStdout: true
            ).trim()

            def parsed = null
            try {
              if (json) {
                writeFile file: "${REPORT_DIR}/npm-audit-${svc}.json", text: json
                parsed = readJSON text: json
              }
            } catch (Exception e) {
              parsed = null
            }

            if (parsed == null) {
              rows << "${svc}: scan unavailable (npm audit could not run)"
              return
            }

            def v = parsed?.metadata?.vulnerabilities ?: [:]
            def info     = v?.info     ?: 0
            def low      = v?.low      ?: 0
            def moderate = v?.moderate ?: 0
            def high     = v?.high     ?: 0
            def critical = v?.critical ?: 0
            def total    = v?.total    ?: 0

            totalHigh += high
            totalCritical += critical

            rows << ''
            rows << "== ${svc}: ${total} vulnerable dep(s) — info=${info} low=${low} moderate=${moderate} high=${high} critical=${critical} =="

            // Per-vulnerability suggestions: package + severity + advisory + fix
            def vulns = parsed?.vulnerabilities
            if (vulns != null && total > 0) {
              def entries = []
              vulns.each { name, vuln -> entries << [name, vuln] }
              entries = entries.sort { a, b -> (sevRank(b[1]?.severity) <=> sevRank(a[1]?.severity)) }

              entries.each { e ->
                def name = e[0]
                def vuln = e[1]
                def sev = vuln?.severity ?: 'unknown'
                def direct = (vuln?.isDirect == true) ? 'direct' : 'transitive'
                def fixText = vuln?.fixAvailable
                  ? 'FIX AVAILABLE → run `npm audit fix` in this service'
                  : 'no auto-fix → review advisory below'
                rows << "  [${sev.toUpperCase()}] ${name} (${direct}): ${fixText}"

                def via = vuln?.via
                if (via instanceof List) {
                  via.each { adv ->
                    if (adv instanceof Map && adv?.title) {
                      rows << "      • ${adv.title}"
                      if (adv?.url) rows << "        ${adv.url}"
                    } else if (adv instanceof String) {
                      rows << "      • introduced via ${adv}"
                    }
                  }
                }
              }
            }
          }

          rows << ''
          if (totalHigh > 0 || totalCritical > 0) {
            rows << "ACTION REQUIRED: ${totalHigh} high / ${totalCritical} critical vulnerabilities found."
            rows << 'SUGGESTION: run `npm audit fix` (non-breaking) in the affected service(s), commit the'
            rows << '           lockfile change, and re-push. For breaking fixes, run `npm audit fix --force`,'
            rows << '           review the changes, then commit.'
          } else {
            rows << 'No high or critical vulnerabilities found. ✅'
          }

          writeFile file: "${REPORT_DIR}/security-summary.txt", text: rows.join('\n') + '\n'
        }
      }
    }

    stage('Secret Scan') {
      steps {
        sh """
          echo '=== Secret Scan (high-signal patterns, heuristic) ==='
          grep -rniE "(password|secret|api_?key|apikey|token)[[:space:]]*[:=][[:space:]]*[^[:space:]]+" \
            --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=build \
            --exclude=package-lock.json . > ${REPORT_DIR}/secret-scan.txt || true
          cat ${REPORT_DIR}/secret-scan.txt || echo 'No secrets found.'
        """
      }
    }
  }

  post {
    always {
      script {
        archiveArtifacts artifacts: "${REPORT_DIR}/*", allowEmptyArchive: true

        if (env.EMAIL_RECIPIENT) {
          def summary = fileExists("${REPORT_DIR}/security-summary.txt")
            ? readFile("${REPORT_DIR}/security-summary.txt")
            : 'No security summary generated.'

          emailext(
            to: env.EMAIL_RECIPIENT,
            subject: "CI #${env.BUILD_ID} [${currentBuild.currentResult}] — Expense Tracker security scan",
            body: summary + "\nConsole: ${env.BUILD_URL}console\n",
            attachmentsPattern: "${REPORT_DIR}/*.json, ${REPORT_DIR}/*.txt",
            mimeType: 'text/plain'
          )
        } else {
          echo 'EMAIL_RECIPIENT not set — skipping email notification.'
        }
      }
    }
  }
}
