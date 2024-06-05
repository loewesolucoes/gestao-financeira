export class EnumUtil {
  public static keyFromValue(en: any, value: any): any {
    return Object.keys(en)[Object.values(en).indexOf(value)]
  }

  public static values(en: any): any[] {
    return Object.keys(en).filter(x => isNaN(x as any))
  }
}
