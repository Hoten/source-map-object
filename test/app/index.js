const someObject = {
  getStuff() {
    console.log('stuff')
  },
  getOtherStuff() {
    this.getStuff()
  },
}

someObject.getStuff()
someObject.getOtherStuff()

const someObject2 = {}
someObject2.loooooonngKey = {}
someObject2.loooooonngKey.anotherLoooooongKey = 'value'
someObject2.loooooonngKey.oneMoreLoooooongKey = 'value2'
console.log(someObject2.loooooonngKey.anotherLoooooongKey)
console.log(someObject2.loooooonngKey.doesNotExist)
