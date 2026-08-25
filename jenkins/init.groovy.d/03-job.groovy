#!groovy
// Auto-create the "expense-tracker-pipeline" job that runs the repo's Jenkinsfile.
import jenkins.model.*
import hudson.plugins.git.*
import hudson.triggers.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition

def instance = Jenkins.instanceOrNull
if (instance == null) return

def env = System.getenv()
def repoUrl = env.GIT_REPO_URL ?: 'https://github.com/KangYan23/expensestracker.git'
def branch  = env.GIT_BRANCH ?: 'main'
def credsId = env.GIT_CREDENTIALS_ID ?: null  // null = public repo; set a credential id if private

def jobName = 'expense-tracker-pipeline'
def job = instance.getItem(jobName)
if (job == null) {
    job = instance.createProject(WorkflowJob.class, jobName)
    println("Bootstrap: created job '${jobName}'")
}

def remote = new UserRemoteConfig(repoUrl, null, null, credsId)
def scm = new GitSCM(
    [remote],
    [new BranchSpec("*/${branch}")],
    (hudson.plugins.git.browser.GitRepositoryBrowser) null,
    (String) null,
    []
)
job.definition = new CpsScmFlowDefinition(scm, 'Jenkinsfile')

// A local Jenkins can't receive GitHub webhooks (no public URL), so poll SCM every 5 min.
if (job.getTriggers().isEmpty()) {
    job.addTrigger(new SCMTrigger('H/5 * * * *'))
}
job.save()
println("Bootstrap: job '${jobName}' -> ${repoUrl} (branch ${branch})")
