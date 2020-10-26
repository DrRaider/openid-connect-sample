
const { Strategy, Issuer } = require('openid-client');

const buildOpenIdClient = async () => {
  const TrustIssuer = await Issuer.discover('https://api.development.forestadmin.com/oidc/.well-known/openid-configuration');
  const client = new TrustIssuer.Client({
    client_id: 'dev',
    client_secret: 'dev',
    redirect_uris: ['http://localhost:3312/callback'],
    response_types: ['code'],
    token_endpoint_auth_method : "none",
    grant_type: 'authorization_code',
  });
  return client;
};

class OidcStrategy extends Strategy {
  constructor(client) {
    super(
      { client },
      (tokenSet, userInfo, done) => {
        console.log('USERINFO: ', userInfo);
        console.log('TOKENSET: ', tokenSet);
        return done(null, tokenSet);
      },
    );

    this.client = client;
  }
}

module.exports = { buildOpenIdClient, OidcStrategy };
