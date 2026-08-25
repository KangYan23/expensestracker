FROM jenkins/jenkins:lts-jdk17

USER root

# Install Node.js 20 so the pipeline can run `npm ci` / `npm audit` / `npm run lint`
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# Pre-install Jenkins plugins (resolves dependencies automatically)
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Groovy init scripts run once on first boot (admin user, SMTP, pipeline job)
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

USER jenkins
