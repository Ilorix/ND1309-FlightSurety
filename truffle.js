module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", 
      port: 8545,        
      network_id: "*", 
      gasPrice: 10000000, 
      gasLimit: 3141592000000        
    }
  },
  compilers: {
    solc: {
      version: "^0.5.16"
    }
  }
};
