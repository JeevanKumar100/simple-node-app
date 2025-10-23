pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'  // Change if using different registry
        DOCKER_USERNAME = credentials('jeevankumar01')
        DOCKER_PASSWORD = credentials('Jeevan@123')
        APP_NAME = 'simple-node-app'
        KUBE_CONFIG = credentials('KUBECONFIG')
    }
    
    stages {
        stage('Checkout from GitHub') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/YOUR_USERNAME/simple-node-app.git',
                credentialsId: 'GITHUB_CREDENTIALS'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Build with timestamp tag and latest
                    def customImage = docker.build("${DOCKER_USERNAME}/${APP_NAME}:${env.BUILD_ID}")
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_CREDENTIALS', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin"
                        sh "docker push ${DOCKER_USERNAME}/${APP_NAME}:${env.BUILD_ID}"
                        sh "docker tag ${DOCKER_USERNAME}/${APP_NAME}:${env.BUILD_ID} ${DOCKER_USERNAME}/${APP_NAME}:latest"
                        sh "docker push ${DOCKER_USERNAME}/${APP_NAME}:latest"
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                        // Update the deployment with new image
                        sh """
                            export KUBECONFIG=${KUBECONFIG}
                            kubectl set image deployment/simple-node-app simple-node-app=${DOCKER_USERNAME}/${APP_NAME}:${env.BUILD_ID} --record
                        """
                        
                        // Wait for rollout to complete
                        sh """
                            export KUBECONFIG=${KUBECONFIG}
                            kubectl rollout status deployment/simple-node-app --timeout=300s
                        """
                    }
                }
            }
        }
        
        stage('Smoke Test') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                        // Get the service URL and test
                        sh """
                            export KUBECONFIG=${KUBECONFIG}
                            kubectl wait --for=condition=ready pod -l app=simple-node-app --timeout=60s
                            SERVICE_URL=\$(kubectl get service simple-node-app-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
                            if [ -z "\$SERVICE_URL" ]; then
                                SERVICE_URL=\$(kubectl get service simple-node-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                            fi
                            echo "Service URL: http://\$SERVICE_URL"
                            
                            # Wait a bit for service to be fully ready
                            sleep 10
                            
                            # Test the application
                            curl -f http://\$SERVICE_URL/health || exit 1
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images to save space
            sh 'docker system prune -f'
        }
        success {
            echo '🎉 Deployment completed successfully!'
            slackSend color: 'good', message: "Deployment successful: ${env.JOB_NAME} - ${env.BUILD_URL}"
        }
        failure {
            echo '❌ Deployment failed!'
            slackSend color: 'danger', message: "Deployment failed: ${env.JOB_NAME} - ${env.BUILD_URL}"
        }
    }
}
