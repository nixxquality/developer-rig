import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { createViewsForTest, createExtensionManifestForTest } from '../tests/constants/extension';
import { mockFetchForUserInfo } from '../tests/mocks';
import { NavItem } from '../constants/nav-items';
import { RigComponent } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { RigExtensionView, RigProject } from '../core/models/rig';
import { ExtensionViewDialogState } from '../extension-view-dialog';
import { ExtensionAnchor, ExtensionViewType } from '../constants/extension-coordinator';

let globalAny = global as any;

localStorage.setItem('projects', '[{"manifest":{}},{"manifest":{}}]');

const setupShallow = setupShallowTest(RigComponent, () => ({
  session: { displayName: 'test', login: 'test', id: 'test', profileImageUrl: 'test.png', authToken: 'test' },
  saveManifest: jest.fn(),
  userLogin: jest.fn()
}));

describe('<RigComponent />', () => {
  function setUpProjectForTest(type: ExtensionAnchor) {
    const extensionViews = createViewsForTest(1, ExtensionAnchors[type], ViewerTypes.LoggedOut);
    localStorage.setItem('projects', JSON.stringify([{ extensionViews, manifest: {} }]));
    localStorage.setItem('currentProjectIndex', '0');
  }

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      try {
        expect(wrapper).toMatchSnapshot();
        resolve();
      } catch (ex) {
        reject(ex.message);
      }
    });
  });

  it('renders extension view correctly', async () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          expect(wrapper).toMatchSnapshot();
          expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('gets extension views from local storage correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          expect(instance.state.currentProject.extensionViews).toEqual(testViews);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('deletes extension view correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);
          instance.deleteExtensionView('1');
          wrapper.update();
          expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(0);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('toggles state when edit dialog is opened/closed', () => {
    setUpProjectForTest(ExtensionAnchor.Component);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          instance.openEditViewHandler('1');
          expect(instance.state.showingEditView).toBe(true);
          expect(instance.state.idToEdit).toBe('1');
          instance.closeEditViewHandler();
          expect(instance.state.showingEditView).toBe(false);
          expect(instance.state.idToEdit).toBe('0');
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('edit changes the view and sets them correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Component);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          instance.openEditViewHandler('1');
          expect(instance.state.showingEditView).toBe(true);
          expect(instance.state.idToEdit).toBe('1');
          instance.editViewHandler({ x: 25, y: 25 });
          const views = instance.state.currentProject.extensionViews;
          const editedView = views.filter((element: RigExtensionView) => element.id === '1');
          expect(editedView[0].x).toEqual(25);
          expect(editedView[0].y).toEqual(25);
          expect(instance.state.showingEditView).toBe(false);
          expect(instance.state.idToEdit).toBe('0');
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('correctly toggles state when create extension view is opened/closed', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          instance.state.currentProject = { manifest: createExtensionManifestForTest() } as RigProject;
          instance.openExtensionViewHandler();
          expect(instance.state.showingExtensionsView).toBe(true);
          instance.closeExtensionViewDialog();
          expect(instance.state.showingExtensionsView).toBe(false);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('correctly sets state when viewHandler is invoked', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          wrapper.setState({ currentProject: { manifest: createExtensionManifestForTest() } as RigProject });
          const instance = wrapper.instance() as RigComponent;
          instance.viewerHandler(NavItem.ExtensionViews);
          expect(instance.state.selectedView).toBe(NavItem.ExtensionViews);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('gets the correct views when getExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          expect(instance.state.currentProject.extensionViews).toEqual(testViews);
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('returns correct data for mobile ', () => {
    const { wrapper } = setupShallow();
    const testDialogState = {
      width: 0,
      height: 0,
      mobileFrameSize: 'iPhone X (375x822)',
      extensionViewType: ExtensionViewType.Mobile
    } as ExtensionViewDialogState;
    const expectedMobileFrameSize = {
      width: 375,
      height: 822,
    };
    const instance = wrapper.instance() as RigComponent;

    let frameSize = instance.getFrameSizeFromDialog(testDialogState);
    expect(frameSize).toEqual(expectedMobileFrameSize);
  });

  it('returns correct data for other types', () => {
    const { wrapper } = setupShallow();
    const overlayTestDialogState = {
      width: 0,
      height: 0,
      frameSize: '640x480',
      extensionViewType: ExtensionViewType.Overlay
    } as ExtensionViewDialogState;
    const expectedOverlayFrameSize = {
      width: 640,
      height: 480,
    };
    const instance = wrapper.instance() as RigComponent;
    const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
    expect(frameSize).toEqual(expectedOverlayFrameSize);
  });

  it('returns correct data for custom size', () => {
    const { wrapper } = setupShallow();
    const overlayTestDialogState = {
      width: 100,
      height: 100,
      frameSize: 'Custom',
      extensionViewType: ExtensionViewType.Overlay
    } as ExtensionViewDialogState;
    const expectedOverlayFrameSize = {
      width: 100,
      height: 100,
    };
    const instance = wrapper.instance() as RigComponent;
    const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
    expect(frameSize).toEqual(expectedOverlayFrameSize);
  });

  it('correctly fetches user info if login not in localStorage', () => {
    globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
    globalAny.window.location.hash = 'access_token=test&';

    setupShallow();
    expect(globalAny.fetch).toHaveBeenCalled();
  });

  globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({
    status: 200,
    json: () => Promise.resolve({}),
  }));

  it('creates project', async () => {
    const { wrapper } = setupShallow();
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          wrapper.update();
          const instance = wrapper.instance() as RigComponent;
          const extensionViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
          await instance.createProject({ extensionViews } as RigProject);
          expect(globalAny.fetch).toHaveBeenCalled();
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('selects project', async () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    await instance.selectProject(1);
    expect(globalAny.fetch).toHaveBeenCalled();
  });

  it('correctly displays an error if user fetch fails', done => {
    const errorMessage = 'test';
    globalAny.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error(errorMessage)));
    globalAny.window.location.hash = 'access_token=test&';
    const { wrapper } = setupShallow();
    setTimeout(() => {
      wrapper.update();
      expect(globalAny.fetch).toHaveBeenCalled();
      expect(wrapper.instance().state.error).toEqual(errorMessage);
      done();
    });
  });
});
