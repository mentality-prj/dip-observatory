import {describe,expect,it} from 'vitest'
import{parseRRInput}from'./input-contract'
import{buildReadinessRecoveryDemo}from'./demo-data'

describe('strict RR import + public planner input boundary',()=>{
  it('accepts a valid built-in synthetic reference scenario',()=>{
    expect(parseRRInput(buildReadinessRecoveryDemo('BALANCED')).issues).toEqual([])
  })
  it('fails closed on missing contract fields, forged metrics and invalid probabilities',()=>{
    const base=buildReadinessRecoveryDemo('BALANCED')
    const invalid:unknown[]=[
      {...base,settings:{...base.settings,seed:'42'}},
      {...base,settings:{...base.settings,simulationSamples:100000}},
      {...base,recoveryActions:[{...base.recoveryActions[0],successProbability:10}]},
      {...base,recoveryActions:[{...base.recoveryActions[0],assetId:'unknown'}]},
      {...base,resources:{...base.resources,extraSecret:'not-allowed'}},
      {...base,assets:[base.assets[0],base.assets[0]]},
      null,
    ]
    for(const value of invalid)expect(parseRRInput(value).input).toBeUndefined()
  })
  it('does not let an imported analysis result affect input acceptance',()=>{
    const input=buildReadinessRecoveryDemo('BALANCED')
    expect(parseRRInput({...input,productionApplyEligible:true}).input).toBeUndefined()
  })
})
