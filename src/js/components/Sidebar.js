import classNames from 'classnames';
import CSSTransitionGroup from 'react-addons-css-transition-group';
import GeminiScrollbar from 'react-gemini-scrollbar';
import {Link, routerShape} from 'react-router';
import React from 'react';
import PluginSDK from 'PluginSDK';

import {keyCodes} from '../utils/KeyboardUtil';
import ClusterHeader from './ClusterHeader';
import EventTypes from '../constants/EventTypes';
import Icon from '../components/Icon';
import InternalStorageMixin from '../mixins/InternalStorageMixin';
import MesosSummaryStore from '../stores/MesosSummaryStore';
import MetadataStore from '../stores/MetadataStore';
import PrimarySidebarLink from '../components/PrimarySidebarLink';
import ScrollbarUtil from '../utils/ScrollbarUtil';
import SidebarActions from '../events/SidebarActions';
import SidebarStore from '../stores/SidebarStore';
import UserAccountDropdown from './UserAccountDropdown';

const {
  NavigationService,
  EventTypes: {NAVIGATION_CHANGE}} = PluginSDK.get('navigation');

const defaultMenuItems = [
  '/dashboard',
  '/services',
  '/jobs',
  '/universe',
  '/nodes',
  '/networking',
  '/security',
  '/cluster',
  '/components',
  '/settings',
  '/organization'
];

const {Hooks} = PluginSDK;

var Sidebar = React.createClass({

  displayName: 'Sidebar',

  mixins: [InternalStorageMixin],

  contextTypes: {
    router: routerShape
  },

  getInitialState() {
    return {expandedItems: []};
  },

  componentDidMount() {
    NavigationService.on(NAVIGATION_CHANGE, this.onNavigationChange);

    this.internalStorage_update({
      mesosInfo: MesosSummaryStore.get('states').lastSuccessful()
    });

    MetadataStore.addChangeListener(
      EventTypes.DCOS_METADATA_CHANGE,
      this.onDCOSMetadataChange
    );

    if (this.sidebarWrapperRef) {
      this.sidebarWrapperRef.addEventListener(
        'transitionend',
        this.handleSidebarTransitionEnd
      );
    }

    global.addEventListener('keydown', this.handleKeyPress, true);
  },

  componentWillUnmount() {
    NavigationService.removeListener(
      NAVIGATION_CHANGE,
      this.onNavigationChange
    );

    MetadataStore.removeChangeListener(
      EventTypes.DCOS_METADATA_CHANGE,
      this.onDCOSMetadataChange
    );

    if (this.sidebarWrapperRef) {
      this.sidebarWrapperRef.removeEventListener(
        'transitionend',
        this.handleSidebarTransitionEnd
      );
    }

    global.removeEventListener('keydown', this.handleKeyPress, true);
  },

  onDCOSMetadataChange() {
    this.forceUpdate();
  },

  onNavigationChange() {
    this.forceUpdate();
  },

  handleInstallCLI() {
    SidebarActions.close();
    SidebarActions.openCliInstructions();
  },

  handleKeyPress(event) {
    const nodeName = event.target.nodeName;

    if (event.keyCode === keyCodes.leftBracket
      && !(nodeName === 'INPUT' || nodeName === 'TEXTAREA')
      && !(event.ctrlKey || event.metaKey || event.shiftKey)) {
      // #sidebarWidthChange is passed as a callback so that the sidebar
      // has had a chance to update before Gemini re-renders.
      this.toggleSidebarDocking();
    }
  },

  handleSubmenuItemClick() {
    SidebarActions.close();
  },

  handleVersionClick() {
    SidebarActions.close();
    SidebarActions.showVersions();
  },

  getNavigationSections() {
    const definition = NavigationService.getDefinition();

    return definition.map((group, index) => {
      let heading = null;
      let menuItems = this.getNavigationGroup(group);

      if (menuItems == null) {
        return null;
      }

      if (group.category !== 'root') {
        heading = (
          <h6 className="sidebar-section-header">
            {group.category}
          </h6>
        );
      }

      return (
        <div className="sidebar-section pod pod-short-bottom flush-top flush-left flush-right"
          key={index}>
          {heading}
          {menuItems}
        </div>
      );
    });
  },

  getNavigationGroup(group) {
    const menuItems = Hooks
      .applyFilter('sidebarNavigation', defaultMenuItems)
      .reduce((routesMap, path) => routesMap.set(path, true), new Map());

    const filteredItems = group.children
     .filter((route) => menuItems.has(route.path));

    let groupMenuItems = filteredItems.map((element, index) => {
      const {pathname} = this.props.location;

      let hasChildren = element.children && element.children.length !== 0;
      let isExpanded = this.state.expandedItems.includes(element.path);
      const isParentActive = pathname.startsWith(element.path);

      let submenu;
      let isChildActive = false;
      if (isExpanded && hasChildren) {
        [submenu, isChildActive] = this.getGroupSubmenu(
          group.path, element.children);
      }

      let linkElement = element.link;
      if (typeof linkElement === 'string') {
        linkElement = (
          <PrimarySidebarLink
            hasChildren={hasChildren}
            isChildActive={isChildActive}
            isExpanded={isExpanded}
            to={element.path}
            icon={element.options.icon}
            onClick={this.handlePrimarySidebarLinkClick.bind(this, element, isChildActive)}>
            {linkElement}
          </PrimarySidebarLink>
        );
      }

      let itemClassSet = classNames('sidebar-menu-item', {
        selected: isParentActive && !isChildActive,
        open: isExpanded
      });

      return (
        <li className={itemClassSet} key={index}>
          {linkElement}
          {submenu}
        </li>
      );
    });

    if (groupMenuItems.length) {
      return <ul className="sidebar-menu">{groupMenuItems}</ul>;
    }

    return null;
  },

  getGroupSubmenu(path, children) {
    const {pathname} = this.props.location;
    let isChildActive = false;

    const childRoutesPaths = children.map(({path}) => path);
    const filteredPaths = Hooks
        .applyFilter('secondaryNavigation', path, childRoutesPaths);

    // Defaulting to unfiltered set of paths
    const childRoutesMap = (filteredPaths || childRoutesPaths)
        .reduce((routesMap, path) => routesMap.set(path, true), new Map());

    const filteredChildRoutes =
        children.filter(({path}) => childRoutesMap.has(path));

    let menuItems = filteredChildRoutes.reduce(
      (children, currentChild, index) => {
        const isActive = pathname.startsWith(currentChild.path);

        let menuItemClasses = classNames({selected: isActive});

        // First matched active child wins,
        // ie in /path/child and /path/child-path without this conditional /path/child-path
        // will always overrule /path/child
        if (!isChildActive && isActive) {
          isChildActive = true;
        }

        let linkElement = currentChild.link;
        if (typeof linkElement === 'string') {
          linkElement = <Link to={currentChild.path}>{linkElement}</Link>;
        }

        children.push(
          <li className={menuItemClasses}
            key={index}
            onClick={this.handleSubmenuItemClick}>
            {linkElement}
          </li>
        );

        return children;
      },
      []
    );

    return [<ul>{menuItems}</ul>, isChildActive];
  },

  getVersion() {
    const data = MetadataStore.get('dcosMetadata');
    if (data == null || data.version == null) {
      return null;
    }

    return (
      <span className="version-number">v.{data.version}</span>
    );
  },

  getSidebarHeader() {
    const defaultItems = [
      {
        className: 'hidden',
        html: (
          <ClusterHeader showCaret={true}
            useClipboard={false}
            onUpdate={this.handleClusterHeaderUpdate} />
        ),
        id: 'dropdown-trigger'
      },
      {
        className: 'dropdown-menu-section-header flush-top',
        html: <label>Support</label>,
        id: 'header-a',
        selectable: false
      },
      {
        html: 'Documentation',
        id: 'documentation',
        onClick: () => {
          global.open(MetadataStore.buildDocsURI('/'), '_blank');
        }
      },
      {
        html: 'Install CLI',
        id: 'install-cli',
        onClick: this.handleInstallCLI
      }
    ];

    return (
      <UserAccountDropdown
        menuItems={Hooks.applyFilter('userDropdownItems', defaultItems)} />
    );
  },

  handleClusterHeaderUpdate() {
    ScrollbarUtil.updateWithRef(this.geminiRef);
  },

  handlePrimarySidebarLinkClick(element, isChildActive) {
    const {expandedItems} = this.state;
    const {path} = element;
    const expandedItemIndex = expandedItems.indexOf(path);

    if (expandedItemIndex === -1) {
      expandedItems.push(path);
    } else if (!isChildActive) {
      expandedItems.splice(expandedItemIndex, 1);
    }

    this.setState({expandedItems});
  },

  handleSidebarTransitionEnd(event) {
    // Some elements (graphs and Gemini) need to update when the main content
    // width canges, so we emit an event.
    if (event.target === this.sidebarWrapperRef) {
      SidebarActions.sidebarWidthChange();
    }
  },

  handleOverlayClick() {
    SidebarActions.close();
  },

  toggleSidebarDocking() {
    global.requestAnimationFrame(() => {
      if (SidebarStore.get('isDocked')) {
        SidebarActions.undock();
      } else {
        SidebarActions.dock();
      }
    });
  },

  render() {
    let dockIconID = 'sidebar-expand';
    let overlay = null;

    if (SidebarStore.get('isDocked')) {
      dockIconID = 'sidebar-collapse';
    }

    if (SidebarStore.get('isVisible')) {
      overlay = (
        <div className="sidebar-backdrop" onClick={this.handleOverlayClick} />
      );
    }

    return (
      <div className="sidebar-wrapper"
        ref={(ref) => { this.sidebarWrapperRef = ref; }}>
        <CSSTransitionGroup
          transitionName="sidebar-backdrop"
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}>
          {overlay}
        </CSSTransitionGroup>
        <div className="sidebar flex flex-direction-top-to-bottom">
          <header className="header flex-item-shrink-0">
            {this.getSidebarHeader()}
          </header>
          <GeminiScrollbar autoshow={true}
            className="flex-item-grow-1 flex-item-shrink-1 gm-scrollbar-container-flex gm-scrollbar-container-flex-view"
            ref={(ref) => this.geminiRef = ref}>
            <div className="sidebar-content-wrapper">
              <div className="sidebar-sections pod pod-narrow">
                {this.getNavigationSections()}
              </div>
              <div className="sidebar-dock-container pod pod-short pod-narrow flush-top">
                <Icon className="sidebar-dock-trigger"
                  size="mini"
                  id={dockIconID}
                  onClick={this.toggleSidebarDocking} />
              </div>
            </div>
          </GeminiScrollbar>
        </div>
      </div>
    );
  }

});

module.exports = Sidebar;
