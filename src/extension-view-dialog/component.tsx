import * as React from 'react';
import './component.sass';
import { ExtensionAnchors } from '../constants/extension-types'
import { OverlaySizes, DefaultOverlaySize, DefaultCustomDimensions } from '../constants/overlay-sizes'
import { ViewerTypes, DefaultViewerType } from '../constants/viewer-types'
import { IdentityOptions, DefaultIdentityOption } from '../constants/identity-options';
import { ViewTypeImages } from '../constants/img-map';
import { RadioOption } from './radio-option';
import { DivOption } from './div-option';
import * as closeButton from '../img/close_icon.png';
import { MobileOrientation, DefaultMobileOrientation, MobileSizes, DefaultMobileSize } from '../constants/mobile';
import { getSupportedAnchors, getSupportedPlatforms } from '../core/models/manifest';
import { ExtensionAnchor, ExtensionMode, ExtensionPlatform, ExtensionViewType } from '../constants/extension-coordinator';

export interface ExtensionViewDialogProps {
  channelId: string;
  extensionViews: ExtensionCoordinator.ExtensionViews;
  closeHandler: Function;
  saveHandler: Function;
}

export interface ExtensionViewDialogState {
  extensionViewType: ExtensionAnchor | ExtensionMode | ExtensionPlatform | ExtensionViewType;
  channelId: string;
  frameSize: string;
  mobileFrameSize: string;
  isChatEnabled: boolean;
  isPopout: boolean;
  viewerType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  identityOption: string;
  linkedUserId: string;
  orientation: string;
  opaqueId?: string;
  [key: string]: number | string | boolean;
}

export class ExtensionViewDialog extends React.Component<ExtensionViewDialogProps, ExtensionViewDialogState> {
  public state: ExtensionViewDialogState = {
    channelId: this.props.channelId,
    extensionViewType: getSupportedAnchors(this.props.extensionViews)[0],
    isChatEnabled: false,
    isPopout: false,
    frameSize: DefaultOverlaySize,
    mobileFrameSize: DefaultMobileSize,
    viewerType: DefaultViewerType,
    x: 0,
    y: 0,
    width: DefaultCustomDimensions.width,
    height: DefaultCustomDimensions.height,
    identityOption: DefaultIdentityOption,
    linkedUserId: '888888888',
    orientation: DefaultMobileOrientation,
  }

  public onChange = (input: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = input.currentTarget;
    this.setState({ [name]: value });
  }

  private renderExtensionTypeComponents() {
    const allowedAnchors = getSupportedAnchors(this.props.extensionViews);
    const allowedPlatforms = getSupportedPlatforms(this.props.extensionViews);
    const divOptions = allowedAnchors.map((key: string) => (
      <DivOption
        key={key}
        img={this.state.extensionViewType === key ? ViewTypeImages[key].on : ViewTypeImages[key].off}
        name={ExtensionAnchors[key]}
        value={key}
        onChange={this.onChange}
        checked={this.state.extensionViewType === key}
      />
    ));
    if (allowedPlatforms.indexOf(ExtensionPlatform.Mobile) !== -1) {
      divOptions.push(
        <DivOption
          key={ExtensionPlatform.Mobile}
          img={this.state.extensionViewType === ExtensionPlatform.Mobile ? ViewTypeImages[ExtensionPlatform.Mobile].on : ViewTypeImages[ExtensionPlatform.Mobile].off}
          name={ExtensionAnchors[ExtensionPlatform.Mobile]}
          value={ExtensionPlatform.Mobile}
          onChange={this.onChange}
          checked={this.state.extensionViewType === ExtensionPlatform.Mobile}
        />
      );
    }
    divOptions.push(
      <DivOption
        key={ExtensionMode.Config}
        img={this.state.extensionViewType === ExtensionMode.Config ? ViewTypeImages[ExtensionMode.Config].on : ViewTypeImages[ExtensionMode.Config].off}
        name={ExtensionAnchors[ExtensionMode.Config]}
        value={ExtensionMode.Config}
        onChange={this.onChange}
        checked={this.state.extensionViewType === ExtensionMode.Config}
      />
    );
    divOptions.push(
      <DivOption
        key={ExtensionMode.Dashboard}
        img={this.state.extensionViewType === ExtensionMode.Dashboard ? ViewTypeImages[ExtensionMode.Dashboard].on : ViewTypeImages[ExtensionMode.Dashboard].off}
        name={ExtensionAnchors[ExtensionMode.Dashboard]}
        value={ExtensionMode.Dashboard}
        onChange={this.onChange}
        checked={this.state.extensionViewType === ExtensionMode.Dashboard}
      />
    );
    return divOptions;
  }

  private renderFrameSizeComponents() {
    return Object.keys(OverlaySizes).map(key => {
      return <RadioOption key={key} name="frameSize" value={key} onChange={this.onChange} checked={key === this.state.frameSize} />
    });
  }

  private renderMobileFrameSizeComponents() {
    return Object.keys(MobileSizes).map(key => {
      return <RadioOption key={key} name="mobileFrameSize" value={key} onChange={this.onChange} checked={key === this.state.mobileFrameSize} />
    });
  }

  private renderViewerTypeComponents() {
    return Object.keys(ViewerTypes).map(key => {
      return <RadioOption key={key} name="viewerType" value={ViewerTypes[key]} onChange={this.onChange} checked={ViewerTypes[key] === this.state.viewerType} />
    });
  }

  private renderIdentityOptionComponents() {
    return Object.keys(IdentityOptions).map(option => {
      const isChecked = option === this.state.identityOption;
      return option === IdentityOptions.Linked ? (
        <div key={option}>
          <RadioOption name="identityOption" value={option} onChange={this.onChange} checked={isChecked} />
          {isChecked && <input type="text" name="linkedUserId" value={this.state.linkedUserId} onChange={this.onChange} />}
        </div>
      ) : (
          <RadioOption key={option} name="identityOption" value={option} onChange={this.onChange} checked={isChecked} />
        );
    });
  }

  private renderOrientationComponents() {
    return Object.keys(MobileOrientation).map(option => {
      return <RadioOption key={option} name="orientation" value={MobileOrientation[option]} onChange={this.onChange} checked={option === this.state.orientation} />
    });
  }

  private close = () => {
    this.props.closeHandler();
  }

  private save = () => {
    this.props.saveHandler(this.state);
  }

  private toggleIsChatEnabled = () => {
    this.setState({ isChatEnabled: !this.state.isChatEnabled });
  }

  private toggleIsPopout = () => {
    this.setState({ isPopout: !this.state.isPopout });
  }

  public render() {
    return (
      <div className="new-extension-view">
        <div className="new-extension-view__background" />
        <div className="new-extension-view__dialog">
          <div className="dialog__top-bar-container">
            <div className="top-bar-container__title"> Add a new view </div>
            <div className="top-bar-container__escape" onClick={this.close}><img alt="Close" src={closeButton} /></div>
          </div>

          <hr className="dialog__divider" />

          <div className="dialog__type-and-size-container">
            <div className="type-title__type-container">
              <div className="type-and-size-container__type-title">
                Extension Type
              </div>
              <div className='dialog__type-container'>
                {this.renderExtensionTypeComponents()}
              </div>
            </div>

            <div className="type-and-size-container__size-title">
              <div className="size-title__size-subcontainer">

                {(this.state.extensionViewType === ExtensionAnchor.Overlay) &&
                  <div className="size-title__size-subcontainer">
                    <div className="size-subcontainer__presets">
                      <div className="type-and-size-container__type-title">
                        Overlay Size
                      </div>
                      <div className='size-subcontainer__presets-container'>
                        <div className='size-subcontainer__size-selection'>
                          {this.renderFrameSizeComponents()}
                        </div>
                        <div className='overlay-custom-container'>
                          <RadioOption className='overlay-custom' name="frameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                          <div className='overlay-custom-container'>
                            <div className="custom-subcontainer__input">
                              <label className="inputs__option-label inputs__width-offset"> Width </label>
                              <input type="text" name="width" onChange={this.onChange} />
                            </div>
                            <div className="custom-subcontainer__input">
                              <label className="inputs__option-label"> Height </label>
                              <input type="text" name="height" onChange={this.onChange} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>}

                {(this.state.extensionViewType === ExtensionPlatform.Mobile) &&
                  <div className="size-title__size-subcontainer">
                    <div className="size-subcontainer__presets">
                      <div className="type-and-size-container__type-title">
                        Screen Size
                      </div>
                      <div className='size-subcontainer__presets-container'>
                        <div className='size-subcontainer__size-selection'>
                          {this.renderMobileFrameSizeComponents()}
                        </div>
                        <div className='overlay-custom-container'>
                          <RadioOption className='overlay-custom' name="mobileFrameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                          <div className='overlay-custom-container'>
                            <div className="custom-subcontainer__input">
                              <label className="inputs__option-label inputs__width-offset"> Width </label>
                              <input type="text" name="width" onChange={this.onChange} />
                            </div>
                            <div className="custom-subcontainer__input">
                              <label className="inputs__option-label"> Height </label>
                              <input type="text" name="height" onChange={this.onChange} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="size-subcontainer__presets">
                      <div className="type-and-size-container__type-title">
                        Orientation
                      </div>
                      <div className='overlay-custom-container'>
                        {this.renderOrientationComponents()}
                      </div>
                    </div>
                  </div>}

                {(this.state.extensionViewType === ExtensionAnchor.Component) &&
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Player Size
                    </div>
                    <div className='size-subcontainer__presets-container'>
                      <div className='size-subcontainer__size-selection'>
                        {this.renderFrameSizeComponents()}
                      </div>
                      <div className='overlay-custom-container'>
                        <RadioOption className='overlay-custom' name="frameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                        <div className='overlay-custom-container'>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label inputs__width-offset"> Width </label>
                            <input type="text" name="width" onChange={this.onChange} />
                          </div>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label"> Height </label>
                            <input type="text" name="height" onChange={this.onChange} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>}

                {(this.state.extensionViewType === ExtensionAnchor.Component) &&
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Position (%)
                    </div>
                    <div className='overlay-custom-container'>
                      <div className='overlay-custom-container'>
                        <div className="custom-subcontainer__input">
                          <label className="inputs__option-label">X</label>
                          <input type="text" name="x" placeholder='0 - 100' onChange={this.onChange} />
                        </div>
                        <div className="custom-subcontainer__input">
                          <label className="inputs__option-label">Y</label>
                          <input type="text" name="y" placeholder='0 - 100' onChange={this.onChange} />
                        </div>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
          {this.state.extensionViewType !== ExtensionMode.Config && this.state.extensionViewType !== ExtensionMode.Dashboard && (
            <div className="dialog__viewer-container">
              <div className="type-title__type-container">
                <div className="type-and-size-container__type-title">
                  Viewer Type
                </div>
                <div className='dialog__type-container'>
                  {this.renderViewerTypeComponents()}
                  <div>
                    {this.state.viewerType === ViewerTypes.LoggedIn &&
                      this.renderIdentityOptionComponents()}
                  </div>
                  <div className='opaque_id-input'>
                    <label className="opaque-id-label">Custom Opaque ID</label>
                    <input type="text" name="opaqueId" onChange={this.onChange} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="dialog__viewer-container">
            <div className="type-title__type-container">
              <div className="type-and-size-container__type-title">
                Feature Flags
              </div>
              <div className='dialog__type-container'>
                <div className="option-div">
                  <label className="option-label">
                    <input id="isChatEnabled" type="checkbox" onChange={this.toggleIsChatEnabled} checked={this.state.isChatEnabled} />
                    Is Chat Enabled
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="dialog__viewer-container">
            <div className="type-title__type-container">
              <div className="type-and-size-container__type-title">
                Frame Properties
              </div>
              <div className='dialog__frame-properties-container'>
                {(this.state.extensionViewType === ExtensionAnchor.Panel || this.state.extensionViewType === ExtensionMode.Dashboard) && (
                  <div className="option-div">
                    <input id="isPopout" type="checkbox" onChange={this.toggleIsPopout} checked={this.state.isPopout} />
                    <label className="option-label" htmlFor="isPopout">Simulate Popout</label>
                  </div>
                )}
                <div className="option-div">
                  <label className="option-label" htmlFor="channelId">Channel ID:</label>
                  <input type="text" name="channelId" value={this.state.channelId} onChange={this.onChange} />
                </div>
              </div>
            </div>
          </div>
          <hr className="dialog__divider" />
          <div className="dialog_bottom-bar">
            <div className="bottom-bar__save" onClick={this.save}> Save </div>
            <div className="bottom-bar__cancel" onClick={this.close}> Cancel </div>
          </div>
        </div>
      </div>
    );
  }
}
