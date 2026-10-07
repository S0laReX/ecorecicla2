export type DesignIconName = 'leaf'|'leaf-white'|'leaf-dashboard'|'person'|'company'|'identity'|'email'|'lock'|'arrow-right'|'back'|'plastic'|'glass'|'paper'|'metal'|'location'|'clock'|'upload'|'document'|'hourglass'|'info'|'home'|'plus'|'history'|'profile'|'step-publish'|'step-collect'|'step-reward';

/** Original Figma vector. Preserve its intrinsic proportions and dimensions. */
export function DesignIcon({name}:{name:DesignIconName}) {
 return <img className="design-icon" src={`/design/${name}.svg`} alt="" aria-hidden="true"/>;
}
