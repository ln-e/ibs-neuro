FROM node:8.6.0
ADD . /code
WORKDIR /code
RUN npm install -g yarn && npm install -g typescript && yarn install --force && yarn run build
CMD npm run run
