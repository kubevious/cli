###############################################################################
# Step 1 : Builder image
FROM kubevious/node-builder:22
RUN node --version
RUN npm --version
RUN yarn --version
WORKDIR /app
# COPY ASSESTS FROM MOCK-DATA
RUN mkdir -p ./assets/k8s-api-json-schema
RUN git clone https://github.com/kubevious/mock-data.git mock-data.git
RUN cp mock-data.git/k8s-api-json-schema/*.json ./assets/k8s-api-json-schema/
RUN rm -rf mock-data.git
# COPY CRD ASSETS
COPY ./crds ./assets/crds
RUN find ./assets
# COPY SOURCES
COPY ./package*.json ./
COPY ./yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ./bin ./bin
COPY ./src ./src
COPY ./tsconfig.json ./
# BUILD
RUN npm run build
RUN npm pack
RUN mv kubevious-$(node -p -e "require('./package.json').version").tgz kubevious.tgz

###############################################################################
# Step 2 : Runner image
FROM node:18-alpine
RUN apk update && apk upgrade && \
    apk --no-cache add ca-certificates bash openssl git curl wget 
# DATA
RUN mkdir -p /data
# HELM 
ENV HELM_CACHE_HOME=/data/helm/cache
ENV HELM_CONFIG_HOME=/data/helm/config
ENV HELM_DATA_HOME=/data/helm/data
RUN mkdir -p ${HELM_CACHE_HOME}
RUN mkdir -p ${HELM_CONFIG_HOME}
RUN mkdir -p ${HELM_DATA_HOME}
WORKDIR /tmp
ADD https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 install_helm.sh
RUN chmod +x install_helm.sh
RUN bash install_helm.sh
RUN rm install_helm.sh
# KUSTOMIZE
ENV KUSTOMIZE_VER=5.2.1
WORKDIR /tmp
RUN curl -L https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv${KUSTOMIZE_VER}/kustomize_v${KUSTOMIZE_VER}_linux_amd64.tar.gz -o kustomize.tar.gz
RUN tar -xvf kustomize.tar.gz
RUN chmod +x kustomize
RUN rm kustomize.tar.gz
RUN mv kustomize /usr/local/bin/
RUN ls -la /usr/local/bin/kustomize
# Kubevious CLI
WORKDIR /app
COPY --from=0 /app/kubevious.tgz ./
RUN npm install -g ./kubevious.tgz
RUN rm -rf /app
WORKDIR /src
COPY ./docker/docker-entrypoint.sh /
RUN addgroup -S kubevious && adduser -S kubevious -G kubevious -h /src
RUN chown -R kubevious:kubevious /data
USER kubevious
ENTRYPOINT ["/docker-entrypoint.sh"]