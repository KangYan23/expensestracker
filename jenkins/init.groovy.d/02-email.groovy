#!groovy
// Configure Jenkins system location + SMTP so Email Extension can send scan reports.
// Values come from docker-compose `environment` (or the project `.env`).
import jenkins.model.*
import hudson.tasks.Mailer

def instance = Jenkins.instanceOrNull
if (instance == null) return

def env = System.getenv()

// Jenkins URL + admin ("from") address
def loc = instance.getExtensionList(jenkins.model.JenkinsLocationConfiguration.class).get(0)
loc.url = env.JENKINS_URL ?: 'http://localhost:8080/'
loc.adminAddress = env.EMAIL_RECIPIENT ?: 'admin@example.com'
loc.save()

// SMTP relay (Gmail by default; any SMTP works)
def mailer = instance.getDescriptorByType(Mailer.DescriptorImpl.class)
mailer.smtpHost = env.SMTP_HOST ?: 'smtp.gmail.com'
mailer.smtpPort = env.SMTP_PORT ?: '587'
mailer.useSsl = (env.SMTP_SSL ?: 'false').toBoolean()
mailer.useTls = (env.SMTP_TLS ?: 'true').toBoolean()
mailer.charset = 'UTF-8'

def smtpUser = env.SMTP_USER ?: ''
if (smtpUser) {
    mailer.setSmtpAuth(smtpUser, env.SMTP_PASS ?: '')
    println("Bootstrap: SMTP -> ${mailer.smtpHost}:${mailer.smtpPort} (user: ${smtpUser})")
} else {
    println("Bootstrap: SMTP -> ${mailer.smtpHost}:${mailer.smtpPort} (no auth)")
}

mailer.save()
