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
WORKDIR /app
COPY --from=0 /app/kubevious.tgz ./
RUN npm install -g ./kubevious.tgz
RUN rm -rf /app
WORKDIR /src
COPY ./docker/docker-entrypoint.sh /
RUN addgroup -S kubevious && adduser -S kubevious -G kubevious -h /src
USER kubevious
ENTRYPOINT ["/docker-entrypoint.sh"]