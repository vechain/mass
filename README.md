# Mass

Backend of VeChain Official [Explorer](https://explore.vechain.org).

## API

+ `GET /api/accounts/:addr` - Get account summary
+ `GET /api/account/:addr/transactions` - Get transactions of account <sup>i</sup>
+ `GET /api/account/:addr/transfers` - Get Token transfers of account <sup>i</sup>
+ `GET /api/blocks/:revision` - Get block, revision can be `best`, `block number` or `block ID`
+ `GET /api/blocks/:blockid/transactions` - Get block transactions
+ `GET /api/blocks/recent` - Get recent blocks
+ `GET /api/transactions/:txid` - Get transaction
+ `GET /api/transactions/recent` - Get recent transactions
+ `GET /api/transfers/recent` - Get recent transfers

<b>i</b> : List API have the functionality of pagination, just specify `limit` and `offset` as the URL parameter. 

## Run Mass

### Clone Source

``` shell
git clone  --recursive https://github.com/vechain/mass.git
cd mass
```

### Dependency && Build

``` shell
npm ci 
npm run build
```

### Configure Typeorm

Follow the official [instruction](https://typeorm.io/#/using-ormconfig), configure your local project.

### Start Server

``` shell
npm start
```