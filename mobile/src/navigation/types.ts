export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  SellerLinesTab: undefined;
  SettingsTab: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  AddDomain: undefined;
  AddSellerLine: undefined;
  DomainDetail: { domainId: string };
  CheckDetail: { domainId: string; checkId: string; fileType?: 'ads.txt' | 'app-ads.txt' };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
