declare module "react-simple-maps" {
  import type { ReactNode, MouseEvent, SVGProps } from "react";

  export interface GeographyFeature {
    rsmKey: string;
    id: number | string;
    properties: Record<string, string | number | undefined>;
    geometry: object;
  }

  export interface GeographiesRenderProps {
    geographies: GeographyFeature[];
    outline: object;
    borders: object;
  }

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    projection?: string;
    width?: number;
    height?: number;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    center?: [number, number];
    children?: ReactNode;
    onMoveStart?: (pos: object, event: MouseEvent) => void;
    onMoveEnd?: (pos: object, event: MouseEvent) => void;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesRenderProps) => ReactNode;
    parseGeographies?: (features: GeographyFeature[]) => GeographyFeature[];
  }

  export interface GeographyStyleSpec {
    fill?: string;
    outline?: string;
    stroke?: string;
    strokeWidth?: number;
    cursor?: string;
    [key: string]: string | number | undefined;
  }

  export interface GeographyProps extends Omit<SVGProps<SVGPathElement>, "style"> {
    geography: GeographyFeature;
    style?: {
      default?: GeographyStyleSpec;
      hover?: GeographyStyleSpec;
      pressed?: GeographyStyleSpec;
    };
  }

  export interface MarkerProps extends SVGProps<SVGGElement> {
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: (event: MouseEvent<SVGGElement>) => void;
    onMouseMove?: (event: MouseEvent<SVGGElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGGElement>) => void;
    onClick?: (event: MouseEvent<SVGGElement>) => void;
  }

  export interface SphereProps extends SVGProps<SVGPathElement> {
    id?: string;
  }

  export interface GraticuleProps extends SVGProps<SVGPathElement> {
    step?: [number, number];
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
  export function Sphere(props: SphereProps): JSX.Element;
  export function Graticule(props: GraticuleProps): JSX.Element;
}
