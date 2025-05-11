--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

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
-- Name: Users; Type: TABLE; Schema: public; Owner: noahdisler
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO noahdisler;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: noahdisler
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO noahdisler;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: noahdisler
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: noahdisler
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO noahdisler;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: noahdisler
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO noahdisler;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: noahdisler
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: noahdisler
--

COPY public."Users" (id, username, email, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: noahdisler
--

COPY public.users (id, username, email, password, created_at) FROM stdin;
1	testuser	testuser@example.com	password123	2025-04-28 18:24:23.496952
\.


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: noahdisler
--

SELECT pg_catalog.setval('public."Users_id_seq"', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: noahdisler
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_username_key; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key" UNIQUE (username);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: noahdisler
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

--
-- Name: word_pairs; Type: TABLE; Schema: public; Owner: noahdisler
--

CREATE TABLE public.word_pairs (
    id serial PRIMARY KEY,
    civilian_word VARCHAR(100) NOT NULL,
    undercover_word VARCHAR(100) NOT NULL
);

ALTER TABLE public.word_pairs OWNER TO noahdisler;

--
-- Data for Name: word_pairs; Type: TABLE DATA; Schema: public; Owner: noahdisler
--

COPY public.word_pairs (id, civilian_word, undercover_word) FROM stdin;
1	apple	pear
2	cat	tiger
3	car	truck
4	doctor	nurse
5	ocean	lake
/.

--
-- PostgreSQL database dump complete
--

