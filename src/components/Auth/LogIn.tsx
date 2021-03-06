import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { Dialog } from "@reach/dialog";
import { useRouter } from "next/router";
import Welcome from "./Welcome";
import { useModal } from "~/components/Modal/index";
import { useI18n } from "~/i18n/index";
import { SvgSpotify, SvgGoogleColor, SvgX } from "~/assets/svg";
import { PlatformName } from "~/graphql/gql.gen";

const SignInContext = createContext<[boolean, () => void]>([
  false,
  () => undefined,
]);

enum AuthState {
  WAITING,
  CONNECTING,
  SUCCESS,
  FAIL,
}

const LogInModal: React.FC<{ active: boolean; close: () => void }> = ({
  active,
  close: closeModal,
}) => {
  const { t } = useI18n();

  const windowRef = useRef<Window | null>();
  const [isAuth, setIsAuth] = useState<AuthState>(AuthState.WAITING);

  const [activeWelcome, openWelcome, closeWelcome] = useModal();

  const close = useCallback(() => {
    windowRef.current?.close();
    closeWelcome();
    closeModal();
  }, [closeModal, closeWelcome]);

  const router = useRouter();

  useEffect(() => {
    router.events.on("routeChangeComplete", close);
    return () => router.events.off("routeChangeComplete", close);
  }, [router, close]);

  const logIn = useCallback(
    (provider: PlatformName) => {
      setIsAuth(AuthState.CONNECTING);
      windowRef.current = window.open(
        `${process.env.API_URI}/auth/${
          provider === PlatformName.Youtube ? "google" : provider
        }`,
        t("auth.label"),
        "width=800,height=600"
      );

      let interval: number;

      new Promise<0 | 1 | 2>((resolve) => {
        interval = window.setInterval(() => {
          try {
            if (!windowRef.current || windowRef.current.closed)
              return resolve(0);
            if (windowRef.current.location.origin === process.env.APP_URI) {
              windowRef.current.close();
              const url = new URL(windowRef.current.location.href);
              if (url.searchParams.get("isNew")) resolve(2);
              else resolve(1);
            }
          } catch (e) {
            // noop
          }
        }, 500);
      }).then((success) => {
        if (success) window.resetUrqlClient();
        window.clearInterval(interval);
        if (success) {
          window.resetUrqlClient();
          success === 1 ? close() : openWelcome();
        }
        setIsAuth(success ? AuthState.SUCCESS : AuthState.FAIL);
      });
    },
    [t, close, openWelcome]
  );

  useEffect(() => {
    if (isAuth === AuthState.SUCCESS) {
      setIsAuth(AuthState.WAITING);
    }
  }, [isAuth, close]);

  return (
    <>
      <Dialog
        aria-label={t("auth.label")}
        isOpen={active}
        onDismiss={close}
        className="p-0 border-0 shadow-xl"
      >
        <div
          className="p-4 bg-blue-tertiary bg-opacity-50 bg-repeat"
          style={{
            background: `url("/images/topography.svg")`,
          }}
        >
          <div className="text-center flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold">Hellooo!</h1>
            <div className="flex flex-wrap flex-center">
              <div className="m-1 p-1 flex flex-col">
                <span className="text-foreground-secondary mb-1 text-xs">
                  {t("auth.listenOn")} <b>YouTube</b>
                </span>
                <button
                  onClick={() => logIn(PlatformName.Youtube)}
                  className="button bg-white text-black text-opacity-50 h-12 hover:opacity-75 transition-opacity duration-300 rounded-full"
                  disabled={isAuth === AuthState.CONNECTING}
                >
                  <SvgGoogleColor
                    width="24"
                    fill="currentColor"
                    strokeWidth="0"
                  />
                  <span className="ml-4 text-sm">Continue with Google</span>
                </button>
              </div>
              <div className="m-1 p-1 flex flex-col">
                <span className="text-foreground-secondary mb-1 text-xs">
                  {t("auth.listenOn")} <b>Spotify</b>
                </span>
                <button
                  onClick={() => logIn(PlatformName.Spotify)}
                  className="button brand-spotify h-12 hover:opacity-75 transition-opacity duration-300 rounded-full"
                  disabled={isAuth === AuthState.CONNECTING}
                >
                  <SvgSpotify width="24" fill="currentColor" strokeWidth="0" />
                  <span className="ml-2 text-sm">Continue with Spotify</span>
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm p-2 rounded-lg text-warning-light max-w-xl mx-auto">
              <Link href="/support/permissions">
                <a className="hover:underline">
                  <span role="img" aria-label="Light Bulb">
                    💡
                  </span>{" "}
                  {t("auth.permissionLink")}
                </a>
              </Link>
            </p>
            <div className="mt-6 text-xs text-foreground-secondary">
              <p>
                {t("player.youtube.footerText")}{" "}
                <a
                  style={{ color: "#ff0022" }}
                  className="opacity-50 hover:opacity-75"
                  href="https://www.youtube.com/premium"
                >
                  youtube.com/premium
                </a>{" "}
                {t("player.youtube.footerTextAfter")}.
              </p>
              <p>
                {t("player.spotify.footerText")}{" "}
                <a
                  style={{ color: "#1db954" }}
                  className="opacity-50 hover:opacity-75"
                  href="https://www.spotify.com/premium"
                >
                  spotify.com/premium
                </a>{" "}
                {t("player.spotify.footerTextAfter")}.
              </p>
            </div>
          </div>
          <p className="mx-auto w-128 max-w-full p-4 pt-0 text-foreground-tertiary text-xs text-center">
            {t("auth.footerText.pre")}{" "}
            <a target="_blank" href="/privacy" className="underline">
              {t("auth.footerText.privacyPolicy")}
            </a>
            ,{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.youtube.com/t/terms"
              className="underline"
            >
              {t("auth.footerText.youtubeTerm")}
            </a>{" "}
            {t("auth.footerText.andOr")}{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.spotify.com/us/legal/privacy-policy/"
              className="underline"
            >
              {t("auth.footerText.spotifyTerm")}
            </a>{" "}
            {t("auth.footerText.whereApplicable")}.
          </p>
        </div>
        <button
          type="button"
          className="button button-transparent absolute top-2 right-0"
          onClick={close}
          title={t("auth.cancelText")}
        >
          <SvgX />
        </button>
      </Dialog>
      <Welcome active={activeWelcome} close={close} />
    </>
  );
};

export const LogInProvider: React.FC = ({ children }) => {
  const [active, open, close] = useModal();
  return (
    <>
      <SignInContext.Provider value={[active, open]}>
        {children}
        <LogInModal active={active} close={close} />
      </SignInContext.Provider>
    </>
  );
};

export const useLogin = () => {
  return useContext(SignInContext);
};
