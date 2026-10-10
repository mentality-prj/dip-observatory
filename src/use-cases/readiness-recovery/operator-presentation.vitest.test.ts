import{describe,expect,it}from'vitest'
import{defaultKernelView,parseKernelView,moveKernelPanel,readKernelView,saveKernelView,KERNEL_VIEW_KEY}from'./operator-presentation'
describe('Kernel operator presentation stays private-data free',()=>{
 it('supports real reordering and density, with strict safe schema',()=>{
   const view=moveKernelPanel(defaultKernelView(),'EVIDENCE',-1)
   expect(view.panels).toEqual(['EXECUTE','EVIDENCE','REPLAN'])
   expect(parseKernelView({...view,density:'COMPACT'}).density).toBe('COMPACT')
   expect(parseKernelView({...view,decisionId:'private'})).toEqual(defaultKernelView())
   expect(parseKernelView({...view,panels:['EXECUTE','EXECUTE','EVIDENCE']})).toEqual(defaultKernelView())
 })
 it('restores and fails closed without localStorage availability',()=>{
  let raw=''
  const storage={getItem:(key:string)=>{expect(key).toBe(KERNEL_VIEW_KEY);return raw},setItem:(k:string,value:string)=>{expect(k).toBe(KERNEL_VIEW_KEY);raw=value}}
  const view=moveKernelPanel(defaultKernelView(),'EVIDENCE',-1)
  expect(saveKernelView(storage,view)).toBe(true)
  expect(readKernelView(storage)).toEqual(view)
  expect(saveKernelView({setItem:()=>{throw new Error('denied')}},view)).toBe(false)
  expect(readKernelView({getItem:()=>'{broken'})).toEqual(defaultKernelView())
 })
})
