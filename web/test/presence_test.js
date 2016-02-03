import {describe, before, it} from "mocha"
import expect from "expect.js"

import {Presence} from "../static/js/phoenix"

let fixtures = {
  joins(){
    return {u1: {metas: [{id: 1, phx_ref: "1.2"}]}}
  },
  leaves(){
    return {u2: {metas: [{id: 2, phx_ref: "2"}]}}
  },
  state(){
    return {
      u1: {metas: [{id: 1, phx_ref: "1"}]},
      u2: {metas: [{id: 2, phx_ref: "2"}]},
      u3: {metas: [{id: 3, phx_ref: "3"}]}
    }
  }
}

describe("syncState", () => {
  it("syncs empty state", () => {
    let newState = {u1: {metas: [{id: 1, phx_ref: "1"}]}}
    let state = {}
    Presence.syncState(state, newState)
    expect(state).to.eql(newState)
  })

  it("onJoins new presences and onLeave's left presences", () => {
    let newState = fixtures.state()
    let state = {u4: {metas: [{id: 4, phx_ref: "4"}]}}
    let joined = {}
    let left = {}
    let onJoin = (key, current, newPres) => {
      joined[key] = {current: current, newPres: newPres}
    }
    let onLeave = (key, current, leftPres) => {
      left[key] = {current: current, leftPres: leftPres}
    }
    Presence.syncState(state, newState, onJoin, onLeave)
    expect(state).to.eql(newState)
    expect(joined).to.eql({
      u1: {current: undefined, newPres: {metas: [{id: 1, phx_ref: "1"}]}},
      u2: {current: undefined, newPres: {metas: [{id: 2, phx_ref: "2"}]}},
      u3: {current: undefined, newPres: {metas: [{id: 3, phx_ref: "3"}]}}
    })
    expect(left).to.eql({
      u4: {current: {metas: []}, leftPres: {metas: [{id: 4, phx_ref: "4"}]}}
    })
  })

  it("onJoins only newly added metas", () => {
    let newState = {u3: {metas: [{id: 3, phx_ref: "3"}, {id: 3, phx_ref: "3.new"}]}}
    let state = {u3: {metas: [{id: 3, phx_ref: "3"}]}}
    let joined = {}
    let left = {}
    let onJoin = (key, current, newPres) => {
      joined[key] = {current: current, newPres: newPres}
    }
    let onLeave = (key, current, leftPres) => {
      left[key] = {current: current, leftPres: leftPres}
    }
    Presence.syncState(state, newState, onJoin, onLeave)
    expect(state).to.eql(newState)
    expect(joined).to.eql({
      u3: {current: {metas: [{id: 3, phx_ref: "3"}]},
           newPres: {metas: [{id: 3, phx_ref: "3"}, {id: 3, phx_ref: "3.new"}]}}
    })
    expect(left).to.be.empty()
  })
})

describe("syncDiff", () => {
  it("syncs empty state", () => {
    let joins = {u1: {metas: [{id: 1, phx_ref: "1"}]}}
    let state = {}
    Presence.syncDiff(state, {
      joins: joins,
      leaves: {}
    })
    expect(state).to.eql(joins)
  })

  it("removes presence when meta is empty and adds additional meta", () => {
    let state = fixtures.state()
    Presence.syncDiff(state, {joins: fixtures.joins(), leaves: fixtures.leaves()})

    expect(state).to.eql({
      u1: {metas: [{id: 1, phx_ref: "1"}, {id: 1, phx_ref: "1.2"}]},
      u3: {metas: [{id: 3, phx_ref: "3"}]}
    })
  })

  it("removes meta while leaving key if other metas exist", () => {
    let state = {
      u1: {metas: [{id: 1, phx_ref: "1"}, {id: 1, phx_ref: "1.2"}]}
    }
    Presence.syncDiff(state, {joins: {}, leaves: {u1: {metas: [{id: 1, phx_ref: "1"}]}}})

    expect(state).to.eql({
      u1: {metas: [{id: 1, phx_ref: "1.2"}]},
    })
  })
})


describe("list", () => {
  it("lists full presence by default", () => {
    let state = fixtures.state()
    expect(Presence.list(state)).to.eql([
      {metas: [{id: 1, phx_ref: "1"}]},
      {metas: [{id: 2, phx_ref: "2"}]},
      {metas: [{id: 3, phx_ref: "3"}]}
    ])
  })

  it("lists with custom function", () => {
    let state = {u1: {metas: [
      {id: 1, phx_ref: "1.first"},
      {id: 1, phx_ref: "1.second"}]
    }}

    let listBy = (key, {metas: [first, ...rest]}) => {
      return first
    }

    expect(Presence.list(state, listBy)).to.eql([
      {id: 1, phx_ref: "1.first"}
    ])
  })
})
