###############################################################################
# Step 1 : Builder image
FROM kubevious/node-builder:14
RUN node --version
RUN npm --version
RUN yarn --version
WORKDIR /app
COPY ./package*.json ./
COPY ./yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ./assets ./assets
COPY ./bin ./bin
COPY ./src ./src
COPY ./tsconfig.json ./
RUN npm run build
RUN npm pack
RUN mv kubevious-$(node -p -e "require('./package.json').version").tgz kubevious.tgz

###############################################################################
# Step 2 : Runner image
FROM node:14-alpine
RUN apk update && apk upgrade && \
    apk --no-cache add ca-certificates bash openssl git curl wget 
# HELM 
WORKDIR /tmp
ADD https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 install_helm.sh
RUN chmod +x install_helm.sh
RUN bash install_helm.sh
RUN rm install_helm.sh
# KUSTOMIZE
WORKDIR /tmp
ADD https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh install_kustomize.sh
RUN chmod +x install_kustomize.sh
RUN ls -la .
RUN bash install_kustomize.sh
RUN ls -la .
RUN mv ./kustomize /usr/local/bin/ 
RUN rm install_kustomize.sh
# Kubevious CLI
WORKDIR /app
COPY --from=0 /app/kubevious.tgz ./
RUN npm install -g ./kubevious.tgz
RUN rm -rf /app
WORKDIR /src
COPY ./docker/docker-entrypoint.sh /
RUN addgroup -S kubevious && adduser -S kubevious -G kubevious -h /src
USER kubevious
ENTRYPOINT ["/docker-entrypoint.sh"]