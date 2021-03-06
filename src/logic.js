export default class Logic {
  constructor() {
    this.conf = {
      components: {},
      introComponents: [],
    }
    this.errors = []
  }
  title(compoentName) {
    return this.conf.components[compoentName].title
  }
  get() {
    return this.conf
  }
  parseNewLogic(input) {
    const outErrs = []
    const warn = (...data) => {
      outErrs.push(data.join(' '))
      console.log("logic parse warning:", ...data)
    }

    let conf = {
      components: {},
      introComponents: [],
    }

    if (input.components) {
      if (Array.isArray(input.components)) {
        input.components.map((component, i) => {
          if (!component.name || !component.title) {
            warn(`logic.components[${i}] does not have a name or title field, this component will be ignored`)
            return
          }
          
          const alreadyUsedNames = []

          let toInsert = {
            name: component.name,
            title: component.title,
            next: component.next ? Array.isArray(component.next) ? component.next : [component.next] : [],
            tooltip: component.tooltip,
            inputs: [],
            advancedInputs: [],
          }

          if (Array.isArray(component.inputs)) {
            component.inputs.map((input, inputID) => {
              if (!input.title || !input.name || !input.type) {
                warn(`logic.components[${i}].inputs[${inputID}] does not have a name, type or title field, this input will be ignored`)
                return
              }

              if (typeof input.validation != 'function' && typeof input.validation != 'undefined') {
                warn(`logic.components[${i}].inputs[${inputID}].validation must be undefined or a function`)
                return
              }
              
              if (typeof input.tooltip != 'string' && input.tooltip !== undefined) {
                warn(`logic.components[${i}].inputs[${inputID}].tooltip must be a string or not undefined`)
                return
              }

              if (alreadyUsedNames.indexOf(input.name) != -1) {
                warn(`logic.components[${i}].inputs[${inputID}].name can't be equal to other names`)
                return
              }

              let toReturn = {
                name: input.name,
                title: input.title,
                type: input.type,
                validation: input.validation,
                tooltip: input.tooltip,
                default: input.default,
              }

              switch (input.type) {
                case 'text':
                  if (typeof input.default != 'string' && input.default !== undefined) {
                    warn(`logic.components[${i}].inputs[${inputID}].default must be a string or undefined, using default empty string`)
                    toReturn.default = ''
                  }
                  if (input.default == undefined) {
                    toReturn.default = ''
                  }
                  break;
                case 'number':
                  if (typeof input.default != 'number' && input.default !== undefined) {
                    warn(`logic.components[${i}].inputs[${inputID}].default must be a number or undefined, using default 0`)
                    toReturn.default = 0
                  }
                  if (input.default == undefined) {
                    toReturn.default = 0
                  }
                  break;
                case 'switch':
                  if (typeof input.default != 'boolean' && input.default !== undefined) {
                    warn(`logic.components[${i}].inputs[${inputID}].default must be a boolean or undefined, using default empty string`)
                    toReturn.default = false
                  }
                  if (input.default == undefined) {
                    toReturn.default = false
                  }
                  break;
                case 'dropdown':
                  if (!Array.isArray(input.options)) {
                    warn(`logic.components[${i}].inputs[${inputID}].options is not defined or is not an array, skipping this item`)
                    return
                  } else {
                    toReturn['options'] = input.options.map((option, optionID) => {
                      if (typeof option.title != 'string' || typeof option.value != 'string' || (typeof option.tooltip != 'string' && option.tooltip != undefined)) {
                        warn(`logic.components[${i}].inputs[${inputID}].options[${optionID}] does not have the correct items (title string, value string, tooltip string), skipping this item`)
                        return
                      }
                      return {
                        title: option.title,
                        tooltip: option.tooltip,
                        value: option.value,
                      }
                    }).filter(item => item)
                  }
                  break;
                default:
                  warn(`logic.components[${i}].inputs[${inputID}].type = '${input.type}' is not valid, this input will be ignored`)
                  return
              }

              alreadyUsedNames.push(input.name)
              toInsert[input.advanced ? 'advancedInputs' : 'inputs'].push(toReturn)
              return
            })
          }

          conf.components[component.name] = toInsert
        })
        Object.keys(conf.components).map(key => {
          conf.components[key].next = conf.components[key].next.filter(componentKey => {
            if (conf.components[componentKey]) {
              return true
            }
            warn(`logic.component[???].next contains '${componentKey}' that does not exsist, this item will be ignored`)
            return false
          })
        })
      } else {
        warn(`logic.components is not an array`) 
      }
    }

    if (input.introComponents) {
      if (Array.isArray(input.introComponents)) {
        input.introComponents.map(name => {
          if (conf.components[name]) {
            conf.introComponents.push(name)
          } else {
            warn(`logic.introComponents['${name}'] is not a known component`) 
          }
        })
      } else if (typeof input.introComponents == 'string') {
        if (conf.components[input.introComponents]) {
          conf.introComponents.push(input.introComponents)
        } else {
          warn(`logic.introComponents = '${name}' is not a known component`) 
        }
      } else {
        warn(`logic.introComponents is not an array or string`) 
      }
    }

    this.errors = outErrs
    this.conf = conf
    return conf
  }
}
