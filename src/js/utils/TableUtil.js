import HealthSorting from '../../../plugins/services/src/js/constants/HealthSorting';
import Util from './Util';

var TableUtil = {
    /**
   * WARNING: When removing/modifying this function be aware of comments/sizes
   * in variables-layout.less
   * Returns an integer of what the expected height of a
   * row will be given the current window dimensions.
   *
   * @return {Integer} Expected row height
   */
  getRowHeight() {
    const defaultRowSize = 29;
    const definitionList = {
      mini: {screen: 480, rowHeight: 32},
      small: {screen: 768, rowHeight: 37},
      medium: {screen: 992, rowHeight: 45},
      large: {screen: 1270, rowHeight: 52}
    };

    let rowHeight = null;
    const windowWidth = global.innerWidth;
    Object.keys(definitionList).forEach(function (size) {
      if (windowWidth >= definitionList[size].screen) {
        rowHeight = definitionList[size].rowHeight;
      }
    });

    return rowHeight || defaultRowSize;
  },

  compareValues(a, b, aTieBreaker, bTieBreaker) {
    a = Util.toLowerCaseIfString(a);
    b = Util.toLowerCaseIfString(b);
    aTieBreaker = Util.toLowerCaseIfString(aTieBreaker);
    bTieBreaker = Util.toLowerCaseIfString(bTieBreaker);
    if (a === b || a == null || b == null) {
      a = aTieBreaker;
      b = bTieBreaker;
    }

    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }

    return 0;
  },

  /**
   * High order function that will provide another high order function to get
   * sort function for tables.
   * @param  {String} tieBreakerProp property to break ties with
   * @param  {Function} getProperty function that takes an item and a
   * property string and returns a value
   *
   * @return {Function} A high order function that will, given a property
   * string and a sort order ('asc' or 'desc'), return a comparator function
   * between two items
   */
  getSortFunction(tieBreakerProp, getProperty) {
    return function (prop, order) {
      return function (a, b) {
        return TableUtil.compareValues(
          getProperty(a, prop, order),
          getProperty(b, prop, order),
          getProperty(a, tieBreakerProp, order),
          getProperty(b, tieBreakerProp, order)
        );
      };
    };
  },

  /**
   * Normalize param received and try mapping to HealthSorting
   * if not able to mapping default to HealthSorting.NA
   *
   * @param {String} name
   * @returns {Number} HealthSorting value
   */
  getHealthValueByName(name) {
    let match;
    name = Util.toUpperCaseIfString(name);
    match = HealthSorting[name];

    // defaults to NA if can't map to a HealthTypes key
    if ( typeof match !== 'number' ) {
      match = HealthSorting.NA;
    }

    return match;
  },

  /**
   * Sort health status
   * based on HealthSorting mapping value
   * where lowest (0) (top of the list) is most important for visibility
   * and highest (3) (bottom of the list) 3 is least important for visibility
   *
   * @param {Object} a
   * @param {Object} b
   * @returns {Number} item position
   */
  sortHealthValues(a, b) {
    const aTieBreaker = Util.toLowerCaseIfString(a.id);
    const bTieBreaker = Util.toLowerCaseIfString(b.id);

    a = TableUtil.getHealthValueByName(a.health);
    b = TableUtil.getHealthValueByName(b.health);

    if (a === b) {
      a = aTieBreaker;
      b = bTieBreaker;
    }

    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }

    return 0;
  },

/**
 *
 * @returns {Function} sortHealthValues
 */
  getHealthSortingOrder() {
    return TableUtil.sortHealthValues;
  }
};

module.exports = TableUtil;
