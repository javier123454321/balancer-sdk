import dotenv from 'dotenv';
import { expect } from 'chai';
import {
  BalancerSdkConfig,
  Network,
  BalancerSDK,
  SeedToken,
  WeightedFactoryParams,
} from '@/.';
import { ADDRESSES } from '@/test/lib/constants';
import { BigNumber } from 'ethers';
import { BALANCER_NETWORK_CONFIG } from '@/lib/constants/config';

dotenv.config();

const sdkConfig: BalancerSdkConfig = {
  network: Network.KOVAN,
  rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA}`,
};

const SEED_TOKENS: Array<SeedToken> = [
  {
    id: 0,
    tokenAddress: ADDRESSES[42].DAI.address,
    weight: 30,
    amount: '200000000',
    symbol: 'DAI',
  },
  {
    id: 1,
    tokenAddress: ADDRESSES[42].USDC.address,
    weight: 40,

    amount: '200000000',
    symbol: 'USDC',
  },
  {
    id: 2,
    tokenAddress: ADDRESSES[42].WBTC.address,
    weight: 30,
    amount: '200000000',
    symbol: 'WBTC',
  },
];

const INIT_JOIN_PARAMS = {
  poolId: 200,
  sender: '0x0000000000000000000000000000000000000001',
  receiver: '0x0000000000000000000000000000000000000002',
  tokenAddresses: [
    ADDRESSES[42].DAI.address,
    ADDRESSES[42].USDC.address,
    ADDRESSES[42].WBTC.address,
  ],
  initialBalancesString: [
    '2000000000000000000',
    '2000000000000000000',
    '2000000000000000000',
  ],
};
const POOL_PARAMS: WeightedFactoryParams = {
  name: '30DAI-40USDC-30WBTC Pool',
  initialFee: '0.1',
  seedTokens: SEED_TOKENS,
  owner: '0x0000000000000000000000000000000000000001',
  value: '0.1',
};

describe('pool factory module', () => {
  context('getCreationTxParams', () => {
    let balancer: BalancerSDK;
    beforeEach(async () => {
      balancer = new BalancerSDK(sdkConfig);
    });
    it('should return the parameters to construct a transaction', async () => {
      const creationTxAttributes = await balancer.pools.weighted.buildCreateTx(
        POOL_PARAMS
      );
      if (creationTxAttributes.error) {
        expect.fail('Should not give error');
      } else {
        expect(creationTxAttributes.to).to.equal(
          BALANCER_NETWORK_CONFIG[1].addresses.contracts.poolFactories.weighted
        );
        expect(creationTxAttributes.value?.toString()).to.equal(
          '100000000000000000'
        );
      }
    });
    it('should return an attributes object for the expected pool', async () => {
      const creationTxAttributes = await balancer.pools.weighted.buildCreateTx(
        POOL_PARAMS
      );
      if (creationTxAttributes.error) {
        expect.fail('Should not give error');
      } else {
        const { attributes } = creationTxAttributes;
        expect(attributes.name).to.eq('30DAI-40USDC-30WBTC Pool');
        expect(attributes.owner).to.eq(
          '0x0000000000000000000000000000000000000001'
        );
        expect(
          attributes.swapFeePercentage.eq(BigNumber.from('100000000000000000'))
        ).to.eq(true);
        expect(attributes.symbol).to.eq('30DAI-40USDC-30WBTC');
        expect(attributes.tokens).to.eql(
          SEED_TOKENS.map((t) => t.tokenAddress)
        );
      }
    });
    it('should return an attributes object with name overrides if sent by user', async () => {
      const params = { ...POOL_PARAMS };
      params.name = 'test';
      params.symbol = '99wbtx-99aave';
      const creationTxParams = await balancer.pools.weighted.buildCreateTx(
        params
      );
      if (creationTxParams.error) {
        expect.fail('Should not give error');
      } else {
        expect(creationTxParams.attributes.name).to.eq(params.name);
        expect(creationTxParams.attributes.symbol).to.eq(params.symbol);
      }
    });
    it('should not create a pool if weight of seed tokens do not add to 100', async () => {
      const params = { ...POOL_PARAMS };
      params.seedTokens[1].weight = 10;
      const creationTxParams = await balancer.pools.weighted.buildCreateTx(
        params
      );
      if (!creationTxParams.error) {
        expect.fail('Should show error');
      } else {
        expect(creationTxParams.message).to.eq('Token weights must add to 100');
      }
    });
  });

  context('getPoolInfoFilter', async () => {
    let balancer: BalancerSDK;
    beforeEach(async () => {
      balancer = new BalancerSDK(sdkConfig);
    });

    it('should return the pool ID from the issuing transaction', async () => {
      const poolInfoFilter = balancer.pools.getPoolInfoFilter();
      expect(poolInfoFilter.length).to.eq(1);
      expect(poolInfoFilter[0]).to.equal(
        '0x83a48fbcfc991335314e74d0496aab6a1987e992ddc85dddbcc4d6dd6ef2e9fc'
      );
    });
  });

  // context('buildInitJoin', async () => {
  //   let balancer: BalancerSDK;
  //   beforeEach(async () => {
  //     balancer = new BalancerSDK(sdkConfig);
  //   });
  //   it('should return transaction attributes for an InitJoin', async () => {
  //     const transactionAttributes = await balancer.pools.weighted.buildInitJoin(
  //       INIT_JOIN_PARAMS
  //     );
  //     expect(transactionAttributes.err).to.not.eq(true);
  //     expect(transactionAttributes.data).to.eq('0x123');
  //     expect(transactionAttributes.to).to.equal(vaultAddress);
  //     expect(transactionAttributes.value).to.equal(true);
  //   });
  // });
});