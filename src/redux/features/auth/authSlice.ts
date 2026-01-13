// Add loading property to the initial state
interface InitialState {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: any | null;
}

export const initialState: InitialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};