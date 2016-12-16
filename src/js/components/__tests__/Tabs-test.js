jest.dontMock('../TabButton');
jest.dontMock('../TabButtonList');
jest.dontMock('../Tabs');
jest.dontMock('../TabView');
jest.dontMock('../TabViewList');

const React = require('react');
const ReactDOM = require('react-dom');
const TestUtils = require('react-addons-test-utils');

const TabButton = require('../TabButton');
const TabButtonList = require('../TabButtonList');
const Tabs = require('../Tabs');
const TabView = require('../TabView');
const TabViewList = require('../TabViewList');

describe('Tabs', function () {

  beforeEach(function () {
    this.instance = TestUtils.renderIntoDocument(
      <Tabs vertical={true}>
        <TabButtonList>
          <TabButton id="foo" label="Foo">
            <TabButton id="bar" label="Bar" />
            <TabButton id="baz" label="Baz">
              <TabButton id="qux" label="Qux" />
            </TabButton>
          </TabButton>
        </TabButtonList>
        <TabViewList>
          <TabView id="foo">
            Foo
          </TabView>
          <TabView id="bar">
            Bar
          </TabView>
          <TabView id="baz">
            Baz
          </TabView>
          <TabView id="qux">
            Qux
          </TabView>
        </TabViewList>
      </Tabs>
    );
  });

  it('should maintain state of the active tab', function () {
    const tabButtons = ReactDOM.findDOMNode(this.instance).querySelectorAll('.menu-tabbed-item');

    expect(this.instance.state.activeTab).toEqual(undefined);
    TestUtils.Simulate.click(tabButtons[0].querySelector('.menu-tabbed-item-label'));
    expect(this.instance.state.activeTab).toEqual('foo');
    TestUtils.Simulate.click(tabButtons[1].querySelector('.menu-tabbed-item-label'));
    expect(this.instance.state.activeTab).toEqual('bar');
  });

  it('should update state if receiving different active tab', function () {
    let instance = TestUtils.renderIntoDocument(
      <Tabs vertical={true} activeTab="qux">
        <TabButtonList>
          <TabButton id="foo" label="Foo">
            <TabButton id="bar" label="Bar" />
            <TabButton id="baz" label="Baz">
              <TabButton id="qux" label="Qux" />
            </TabButton>
          </TabButton>
        </TabButtonList>
        <TabViewList>
          <TabView id="foo">
            Foo
          </TabView>
          <TabView id="bar">
            Bar
          </TabView>
          <TabView id="baz">
            Baz
          </TabView>
          <TabView id="qux">
            Qux
          </TabView>
        </TabViewList>
      </Tabs>
    );

    const tabButtons = ReactDOM.findDOMNode(instance).querySelectorAll('.menu-tabbed-item');

    expect(instance.state.activeTab).toEqual('qux');
    TestUtils.Simulate.click(tabButtons[0].querySelector('.menu-tabbed-item-label'));
    expect(instance.state.activeTab).toEqual('foo');

    TestUtils.Simulate.click(tabButtons[1].querySelector('.menu-tabbed-item-label'));
    instance = TestUtils.renderIntoDocument(
      <Tabs vertical={true} activeTab="baz">
        <TabButtonList>
          <TabButton id="foo" label="Foo">
            <TabButton id="bar" label="Bar" />
            <TabButton id="baz" label="Baz">
              <TabButton id="qux" label="Qux" />
            </TabButton>
          </TabButton>
        </TabButtonList>
        <TabViewList>
          <TabView id="foo">
            Foo
          </TabView>
          <TabView id="bar">
            Bar
          </TabView>
          <TabView id="baz">
            Baz
          </TabView>
          <TabView id="qux">
            Qux
          </TabView>
        </TabViewList>
      </Tabs>
    );

    expect(instance.state.activeTab).toEqual('baz');
  });

  it('should pass the activeTab prop to its children', function () {
    const tabButtons = ReactDOM.findDOMNode(this.instance).querySelectorAll('.menu-tabbed-item');

    // Click on the 'Foo' tab.
    TestUtils.Simulate.click(tabButtons[0].querySelector('.menu-tabbed-item-label'));

    const tabViewsInstance = TestUtils.scryRenderedComponentsWithType(this.instance, TabViewList)[0];
    const tabButtonsInstance = TestUtils.scryRenderedComponentsWithType(this.instance, TabButtonList)[0];

    expect(tabViewsInstance.props.activeTab).toEqual('foo');
    expect(tabButtonsInstance.props.activeTab).toEqual('foo');
  });

  it('should pass the change handler to TabButtonList', function () {
    const tabButtonsInstance = TestUtils.scryRenderedComponentsWithType(this.instance, TabButtonList)[0];
    expect(tabButtonsInstance.props.onChange).toEqual(this.instance.handleTabChange);
  });

  it('should pass the vertical prop to TabButtonList', function () {
    const tabButtonsInstance = TestUtils.scryRenderedComponentsWithType(this.instance, TabButtonList)[0];
    expect(tabButtonsInstance.props.vertical).toEqual(true);
  });

});
