#!groovy
// Bootstrap: create the admin account and enable login security.
// Runs on every boot but only creates the user if it doesn't already exist.
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.instanceOrNull
if (instance == null) return

def adminUser = System.getenv('JENKINS_ADMIN_USER') ?: 'admin'
def adminPass = System.getenv('JENKINS_ADMIN_PASS') ?: 'admin'

def realm = instance.securityRealm
if (!(realm instanceof HudsonPrivateSecurityRealm)) {
    realm = new HudsonPrivateSecurityRealm(false)
    instance.securityRealm = realm
}

def hr = realm as HudsonPrivateSecurityRealm
if (hr.getUser(adminUser) == null) {
    hr.createAccount(adminUser, adminPass)
    println("Bootstrap: created admin user '${adminUser}'")
} else {
    println("Bootstrap: admin user '${adminUser}' already exists")
}

// Require login for all access.
instance.authorizationStrategy = new FullControlOnceLoggedInAuthorizationStrategy()
instance.save()
println("Bootstrap: security realm ready")
