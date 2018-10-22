import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';
import { EditViewDialog, EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { fetchUserExtensionManifest } from '../util/extension';
import { fetchUser, stopHosting, fetchGlobalConfigurationSegment, fetchChannelConfigurationSegments, saveConfigurationSegment } from '../util/api';
import { NavItem } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { Configurations, RigExtensionView, RigProject } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
import { ProjectView } from '../project-view';
import { CreateProjectDialog } from '../create-project-dialog';
import { ConfigurationServiceView } from '../configuration-service-view';
import { zip } from '../util/zip';

enum LocalStorageKeys {
  RigLogin = 'rigLogin',
}

export interface ReduxStateProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  saveManifest: (manifest: ExtensionManifest) => void;
  userLogin: (userSession: UserSession) => void;
}

interface State {
  projects: RigProject[],
  configurations?: Configurations;
  currentProject?: RigProject,
  showingExtensionsView: boolean;
  showingEditView: boolean;
  showingCreateProjectDialog: boolean;
  idToEdit: string;
  selectedView: NavItem;
  extensionsViewContainerKey: number;
  userId?: string;
  error?: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    projects: [],
    showingExtensionsView: false,
    showingEditView: false,
    showingCreateProjectDialog: false,
    idToEdit: '0',
    selectedView: NavItem.ProjectOverview,
    extensionsViewContainerKey: 0,
  }

  get currentProjectIndex() { return this.state.projects.indexOf(this.state.currentProject); }

  constructor(props: Props) {
    super(props);
    this.setLogin().then(this.loadProjects);
  }

  public openEditViewHandler = (id: string) => {
    this.setState({
      showingEditView: true,
      idToEdit: id,
    });
  }

  public closeEditViewHandler = () => {
    this.setState({
      showingEditView: false,
      idToEdit: '0',
    });
  }

  public viewerHandler = (selectedView: NavItem) => {
    this.setState({ selectedView });
  }

  public openExtensionViewHandler = () => {
    if (!this.state.error) {
      this.setState({
        showingExtensionsView: true,
      });
    }
  }

  public closeExtensionViewDialog = () => {
    this.setState({
      showingExtensionsView: false
    });
  }

  public getFrameSizeFromDialog(extensionViewDialogState: ExtensionViewDialogState) {
    const key = extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile ? 'mobileFrameSize' : 'frameSize';
    if (extensionViewDialogState[key] === 'Custom') {
      return {
        width: extensionViewDialogState.width,
        height: extensionViewDialogState.height
      };
    }

    const sizes = extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile ? MobileSizes : OverlaySizes;''
    return sizes[extensionViewDialogState[key]];
  }

  public createExtensionView = async (extensionViewDialogState: ExtensionViewDialogState) => {
    const extensionViews = this.state.currentProject.extensionViews || [];
    const mode = extensionViewDialogState.extensionViewType === ExtensionMode.Config ? ExtensionMode.Config :
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard ? ExtensionMode.Dashboard : ExtensionMode.Viewer;
    const linked = extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard;
    const nextExtensionViewId = 1 + extensionViews.reduce((reduced: number, view: RigExtensionView) => {
      return Math.max(reduced, parseInt(view.id, 10));
    }, 0);
    extensionViews.push({
      id: nextExtensionViewId.toString(),
      channelId: extensionViewDialogState.channelId,
      type: extensionViewDialogState.extensionViewType,
      features: {
        isChatEnabled: extensionViewDialogState.isChatEnabled,
      },
      linked,
      linkedUserId: extensionViewDialogState.linkedUserId,
      opaqueId: extensionViewDialogState.opaqueId,
      mode,
      isPopout: extensionViewDialogState.isPopout,
      role: extensionViewDialogState.viewerType,
      x: extensionViewDialogState.x,
      y: extensionViewDialogState.y,
      orientation: extensionViewDialogState.orientation,
      frameSize: this.getFrameSizeFromDialog(extensionViewDialogState),
    });
    this.updateExtensionViews(extensionViews);
    const { manifest, secret } = this.state.currentProject;
    await this.updateConfiguration(manifest, extensionViews, this.state.userId, secret);
    this.closeExtensionViewDialog();
  }

  public deleteExtensionView = (id: string) => {
    this.updateExtensionViews(this.state.currentProject.extensionViews.filter(element => element.id !== id));
  }

  public editViewHandler = (newViewState: EditViewProps) => {
    const views = this.state.currentProject.extensionViews;
    views.forEach((element: RigExtensionView) => {
      if (element.id === this.state.idToEdit) {
        element.x = newViewState.x;
        element.y = newViewState.y;
        element.orientation = newViewState.orientation;
      }
    });
    this.updateExtensionViews(views);
    this.closeEditViewHandler();
  }

  public createProject = async (project: RigProject) => {
    this.state.currentProject && await stopHosting();
    this.setState((previousState) => {
      const previousProjects = previousState.currentProject ? previousState.projects : [];
      localStorage.setItem('currentProjectIndex', previousProjects.length.toString());
      const projects = [...previousProjects, project];
      localStorage.setItem('projects', JSON.stringify(projects));
      return { currentProject: project, projects, selectedView: NavItem.ProjectOverview, showingCreateProjectDialog: false };
    });
  }

  public updateProject = (project: RigProject) => {
    this.setState((previousState) => {
      const currentProject = Object.assign(previousState.currentProject, project);
      const projects = previousState.projects;
      localStorage.setItem('projects', JSON.stringify(projects));
      return { currentProject, projects };
    });
  }

  public showCreateProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: true });
  }

  public selectProject = async (projectIndex: number) => {
    const selectedProject = this.state.projects[projectIndex];
    if (selectedProject !== this.state.currentProject) {
      await stopHosting();
      this.setState({ currentProject: selectedProject, selectedView: NavItem.ProjectOverview });
      this.refreshViews();
      localStorage.setItem('currentProjectIndex', this.currentProjectIndex.toString());
    }
  }

  public closeProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: false });
  }

  public render() {
    const { configurations, currentProject } = this.state;
    return (
      <div className="rig-container">
        <RigNav
          currentProjectIndex={this.currentProjectIndex}
          projects={this.state.projects}
          createNewProject={this.showCreateProjectDialog}
          selectProject={this.selectProject}
          manifest={currentProject ? currentProject.manifest : null}
          selectedView={this.state.selectedView}
          viewerHandler={this.viewerHandler}
          error={this.state.error}
        />
        {this.state.error ? (
          <label>Something went wrong: {this.state.error}</label>
        ) : !this.props.session ? (
          <SignInDialog />
        ) : (
          <>
            {this.state.selectedView === NavItem.ProductManagement && <ProductManagementViewContainer clientId={currentProject.manifest.id} />}
            {this.state.selectedView === NavItem.ProjectOverview && currentProject && <ProjectView
              key={this.currentProjectIndex}
              rigProject={currentProject}
              userId={this.state.userId}
              onChange={this.updateProject}
              refreshViews={this.refreshViews}
            />}
            {configurations && this.state.selectedView === NavItem.ConfigurationService && <ConfigurationServiceView
              authToken={this.props.session.authToken}
              configurations={configurations}
              rigProject={currentProject}
              userId={this.state.userId}
              saveHandler={this.saveConfiguration}
            />}
            {currentProject && <ExtensionViewContainer
              key={`ExtensionViewContainer${this.state.extensionsViewContainerKey}`}
              configurations={configurations}
              isDisplayed={this.state.selectedView === NavItem.ExtensionViews}
              deleteExtensionViewHandler={this.deleteExtensionView}
              extensionViews={currentProject.extensionViews}
              isLocal={currentProject.isLocal}
              manifest={currentProject.manifest}
              secret={currentProject.secret}
              openEditViewHandler={this.openEditViewHandler}
              openExtensionViewHandler={this.openExtensionViewHandler}
            />}
            {(!currentProject || this.state.showingCreateProjectDialog) && <CreateProjectDialog
              userId={this.state.userId}
              mustSave={!currentProject}
              closeHandler={this.closeProjectDialog}
              saveHandler={this.createProject}
            />}
            {this.state.showingExtensionsView && (
              <ExtensionViewDialog
                channelId="265737932"
                extensionViews={currentProject.manifest.views}
                closeHandler={this.closeExtensionViewDialog}
                saveHandler={this.createExtensionView}
              />
            )}
            {this.state.showingEditView && (
              <EditViewDialog
                idToEdit={this.state.idToEdit}
                views={currentProject.extensionViews}
                closeHandler={this.closeEditViewHandler}
                saveViewHandler={this.editViewHandler}
              />
            )}
          </>
        )}
      </div>
    );
  }

  private saveConfiguration = (segment: string, channelId: string, content: string, version: string) => {
    const { manifest: { id: clientId }, secret } = this.state.currentProject;
    saveConfigurationSegment(clientId, this.state.userId, secret, segment, channelId, content, version);
  }

  private refreshViews = () => {
    this.setState((previousState) => ({ extensionsViewContainerKey: previousState.extensionsViewContainerKey + 1 }));
  }

  public updateExtensionViews(extensionViews: RigExtensionView[]) {
    this.updateProject({ extensionViews } as RigProject);
  }

  private loadProjects = async () => {
    const projectsValue = localStorage.getItem('projects');
    const { userId } = this.state;
    if (projectsValue) {
      const projects = JSON.parse(projectsValue) as RigProject[];
      const currentProject = projects[Number(localStorage.getItem('currentProjectIndex') || 0)];
      const selectedView = currentProject.backendCommand || currentProject.frontendCommand || currentProject.frontendFolderName ?
        NavItem.ProjectOverview : NavItem.ExtensionViews;
      this.setState({ currentProject, projects, selectedView });
      const { manifest, extensionViews, secret } = currentProject;
      await this.updateConfiguration(manifest, extensionViews, this.state.userId, secret);
    } else if (process.env.EXT_CLIENT_ID && process.env.EXT_SECRET && process.env.EXT_VERSION) {
      const serializedExtensionViews = localStorage.getItem('extensionViews');
      const currentProject: RigProject = {
        extensionViews: serializedExtensionViews ? JSON.parse(serializedExtensionViews) : [],
        isLocal: process.env.EXT_SECRET.startsWith('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'),
        projectFolderPath: '',
        manifest: { id: process.env.EXT_CLIENT_ID, version: process.env.EXT_VERSION } as ExtensionManifest,
        secret: process.env.EXT_SECRET,
        frontendFolderName: '',
        frontendCommand: '',
        backendCommand: '',
      };
      const projects = [currentProject];
      this.setState({ currentProject, projects });
      localStorage.setItem('projects', JSON.stringify(projects));
      localStorage.setItem('currentProjectIndex', '0');
      const { isLocal, secret, manifest: { id: clientId, version } } = currentProject;
      try {
        const manifest = await fetchUserExtensionManifest(isLocal, userId, secret, clientId, version);
        this.setState((previousState) => {
          Object.assign(previousState.currentProject, { manifest });
          localStorage.setItem('projects', JSON.stringify([previousState.currentProject]));
          return previousState;
        });
      } catch (ex) {
        console.error(ex.message);
      }
    }
  }

  private async updateConfiguration(manifest: ExtensionManifest, extensionViews: RigExtensionView[], userId: string, secret: string) {
    if (manifest.configurationLocation === 'hosted') {
      const { id: clientId } = manifest;
      try {
        const channelIds = extensionViews ?
          Array.from(new Set<string>(extensionViews.map((view) => view.channelId))) : [];
        const channelValues = await Promise.all(channelIds.map((channelId) => (
          fetchChannelConfigurationSegments(clientId, userId, channelId, secret)
        )));
        const configurations = {
          globalSegment: await fetchGlobalConfigurationSegment(clientId, userId, secret),
          channelSegments: zip(channelIds, channelValues).reduce((segments, pair) => {
            segments[pair[0]] = pair[1];
            return segments;
          }, {}),
        };
        this.setState({ configurations });
      } catch (ex) {
        console.error(`Cannot load configuration for client ID "${clientId}": ${ex.message}`);
      }
    }
  }

  private async setLogin() {
    const windowHash = window.location.hash;
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);

      try {
        const response = await fetchUser(accessToken);
        const userSession = {
          authToken: accessToken,
          displayName: response.display_name,
          id: response.id,
          login: response.login,
          profileImageUrl: response.profile_image_url || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png',
        };

        this.props.userLogin(userSession);
        localStorage.setItem(LocalStorageKeys.RigLogin, JSON.stringify(userSession));
        window.location.assign('/');
      } catch (ex) {
        this.setState({ error: ex.message });
      }
    } else {
      const rigLogin = localStorage.getItem(LocalStorageKeys.RigLogin);
      if (rigLogin) {
        try {
          const userSession = JSON.parse(rigLogin) as UserSession;
          if (userSession && userSession.authToken && userSession.id && userSession.login && userSession.profileImageUrl) {
            this.props.userLogin(userSession);
            this.state.userId = userSession.id;
          } else {
            localStorage.removeItem(LocalStorageKeys.RigLogin);
          }
        } catch (ex) {
          localStorage.removeItem(LocalStorageKeys.RigLogin);
        }
      }
    }
  }
}
