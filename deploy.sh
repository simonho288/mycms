#!/bin/sh

cd frontend
rm dist/*
parcel build *.html

cd ..
wrangler publish