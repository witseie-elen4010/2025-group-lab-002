--
-- PostgreSQL database dump (cleaned version)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Drop the duplicate lowercase users table
--
DROP TABLE IF EXISTS public.users CASCADE;
DROP SEQUENCE IF EXISTS public.users_id_seq CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP SEQUENCE IF EXISTS public.votes_id_seq CASCADE;

--
-- Name: Users; Type: TABLE; Schema: public
--
CREATE TABLE public."users" (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public
--
CREATE SEQUENCE public."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--
ALTER SEQUENCE public."users_id_seq" OWNED BY public."users".id;

--
-- Name: Users id; Type: DEFAULT; Schema: public
--
ALTER TABLE ONLY public."users" ALTER COLUMN id SET DEFAULT nextval('public."users_id_seq"'::regclass);

--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public
--
SELECT pg_catalog.setval('public."users_id_seq"', 1, false);

--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public
--
ALTER TABLE ONLY public."users"
    ADD CONSTRAINT "users_email_key" UNIQUE (email);

--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public
--
ALTER TABLE ONLY public."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

--
-- Name: Users Users_username_key; Type: CONSTRAINT; Schema: public
--
ALTER TABLE ONLY public."users"
    ADD CONSTRAINT "users_username_key" UNIQUE (username);

--
-- Name: word_pairs; Type: TABLE; Schema: public
--
CREATE TABLE public.word_pairs (
    id serial PRIMARY KEY,
    civilian_word VARCHAR(100) NOT NULL,
    undercover_word VARCHAR(100) NOT NULL
);

--
-- Data for Name: word_pairs; Type: TABLE DATA; Schema: public
--
COPY public.word_pairs (id, civilian_word, undercover_word) FROM stdin;
1	apple	pear
2	cat	tiger
3	car	truck
4	doctor	nurse
5	ocean	lake
\.

--
-- Name: votes; Type: TABLE; Schema: public
--
CREATE TABLE public.votes (
    id serial PRIMARY KEY,
    player_id integer NOT NULL,
    voted_for_id integer NOT NULL,
    round_number integer NOT NULL,
    game_id integer NOT NULL
);

--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public
--
SELECT pg_catalog.setval('public.votes_id_seq', 1, false);

